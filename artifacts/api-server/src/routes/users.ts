import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, ilike, ne, or, sql, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { toPublicUser } from "../lib/userHelpers";
import { UpdateMeBody } from "@workspace/api-zod";

const router = Router();

router.get("/users", requireAuth, async (req, res) => {
  const rawSearch = typeof req.query["search"] === "string" ? req.query["search"] : "";
  const search = rawSearch.trim().replace(/[%_\\]/g, "");
  const me = req.session.userId!;
  if (search.length < 2) { res.json([]); return; }
  const term = `%${search}%`; const prefix = `${search}%`; const normalizedSearch = search.toLowerCase();
  const users = await db.select().from(usersTable).where(and(eq(usersTable.discoverable, true), ne(usersTable.id, me), or(ilike(usersTable.username, term), ilike(usersTable.displayName, term))))
    .orderBy(sql<number>`CASE WHEN lower(${usersTable.username}) = ${normalizedSearch} THEN 0 WHEN lower(${usersTable.displayName}) = ${normalizedSearch} THEN 1 WHEN lower(${usersTable.username}) LIKE lower(${prefix}) THEN 2 WHEN lower(${usersTable.displayName}) LIKE lower(${prefix}) THEN 3 ELSE 4 END`, sql`lower(${usersTable.username}) ASC`).limit(20);
  res.json(users.map(toPublicUser));
});

router.get("/users/me", requireAuth, async (req, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId!)).limit(1);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json({ ...toPublicUser(user), messageSearchOnly: user.messageSearchOnly, discoverable: user.discoverable });
});

router.patch("/users/me", requireAuth, async (req, res) => {
  const parsed = UpdateMeBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const updates: Record<string, any> = {};
  if (parsed.data.displayName) updates.displayName = parsed.data.displayName;
  if (parsed.data.bio !== undefined) updates.bio = parsed.data.bio ?? "";
  if (parsed.data.avatarUrl !== undefined) updates.avatarUrl = parsed.data.avatarUrl ?? "";
  const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, req.session.userId!)).returning();
  res.json({ ...toPublicUser(user), messageSearchOnly: user.messageSearchOnly, discoverable: user.discoverable });
});

router.patch("/users/me/privacy", requireAuth, async (req, res) => {
  const updates: Record<string, boolean> = {};
  if (typeof req.body?.messageSearchOnly === "boolean") updates.messageSearchOnly = req.body.messageSearchOnly;
  if (typeof req.body?.discoverable === "boolean") updates.discoverable = req.body.discoverable;
  if (!Object.keys(updates).length) { res.status(400).json({ error: "No privacy settings supplied" }); return; }
  const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, req.session.userId!)).returning();
  res.json({ ...toPublicUser(user), messageSearchOnly: user.messageSearchOnly, discoverable: user.discoverable });
});

router.post("/users/me/heartbeat", requireAuth, async (req, res) => {
  await db.update(usersTable).set({ isOnline: true, lastSeen: new Date() }).where(eq(usersTable.id, req.session.userId!));
  res.json({ ok: true });
});

router.get("/users/:userId", requireAuth, async (req, res) => {
  const userId = parseInt(String(req.params["userId"] ?? ""));
  if (isNaN(userId)) { res.status(400).json({ error: "Invalid user ID" }); return; }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json(toPublicUser(user));
});

export default router;
