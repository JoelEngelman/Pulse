import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ImagePlus, Loader2, Send, Music2, BarChart3 } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useGetMe } from "@workspace/api-client-react";

const API = "https://pulse-api-proxy.joeldavidengelman.workers.dev";

async function api(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}

async function imageData(file: File) {
  const bitmap = await createImageBitmap(file);
  const max = 1400;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not process that image.");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.8);
}

export default function CreatorStudio() {
  const [, setLocation] = useLocation();
  const { data: user } = useGetMe();
  const [content, setContent] = useState("");
  const [image, setImage] = useState("");
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const all = await api("/api/feed?mode=for-you");
      setPosts(all.filter((post: any) => String(post.user?.id) === String(user?.id)));
      setError("");
    } catch (err: any) {
      setError(err.message || "Could not load your posts.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  const publish = async () => {
    if (!content.trim() && !image) return;
    setSaving(true);
    setError("");
    try {
      const post = await api("/api/posts", {
        method: "POST",
        body: JSON.stringify({ content: content.trim(), imageUrl: image || null }),
      });
      setPosts((current) => [post, ...current]);
      setContent("");
      setImage("");
    } catch (err: any) {
      setError(err.message || "Could not publish your post.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-5 md:py-8">
        <button
          onClick={() => setLocation("/feed")}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="flex items-center gap-3 mb-7">
          <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary grid place-items-center">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Creator Studio</h1>
            <p className="text-sm text-muted-foreground">Create and manage your Pulse Social posts.</p>
          </div>
        </div>

        <section className="bg-card border border-border rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={user?.avatarUrl || ""} />
              <AvatarFallback>{user?.displayName?.slice(0, 1) || "P"}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{user?.displayName}</p>
              <p className="text-xs text-muted-foreground">@{user?.username}</p>
            </div>
          </div>

          <Textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            maxLength={500}
            placeholder="Create something for Pulse…"
            className="min-h-28 resize-none"
          />

          {image && <img src={image} alt="Post preview" className="mt-3 max-h-80 w-full object-cover rounded-xl" />}

          <div className="flex flex-wrap items-center gap-2 mt-3">
            <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-secondary text-sm">
              <ImagePlus className="w-4 h-4" />
              Photo
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    try {
                      setImage(await imageData(file));
                      setError("");
                    } catch (err: any) {
                      setError(err.message || "Could not process that image.");
                    }
                  }
                  event.currentTarget.value = "";
                }}
              />
            </label>

            <span className="inline-flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
              <Music2 className="w-4 h-4" />
              Music is available in Pulse Social
            </span>

            <Button
              onClick={publish}
              disabled={saving || (!content.trim() && !image)}
              className="ml-auto cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Publish
            </Button>
          </div>

          {error && <p className="text-sm text-destructive mt-3">{error}</p>}
        </section>

        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Your posts</h2>
          <span className="text-sm text-muted-foreground">{posts.length} loaded</span>
        </div>

        {loading ? (
          <Loader2 className="animate-spin" />
        ) : posts.length ? (
          posts.map((post) => (
            <article key={post.id} className="bg-card border border-border rounded-2xl p-4 mb-3">
              <p className="text-sm whitespace-pre-wrap">{post.content}</p>
              {post.media?.image && (
                <img src={post.media.image} alt="" className="mt-3 max-h-80 w-full object-cover rounded-xl" />
              )}
              <p className="text-xs text-muted-foreground mt-3">
                {post.createdAt ? new Date(post.createdAt).toLocaleString() : ""} · {post.likeCount || 0} likes · {post.commentCount || 0} comments
              </p>
            </article>
          ))
        ) : (
          <div className="border border-dashed border-border rounded-2xl p-8 text-center text-sm text-muted-foreground">
            You haven't published anything yet.
          </div>
        )}
      </div>
    </div>
  );
}
