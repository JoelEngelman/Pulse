import { X } from "lucide-react";
import { useState } from "react";

const HELP_URL = "https://joelengelman.github.io/pulse-help/";

export function NameVoteCard() {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem("pulse-name-vote-dismissed") === "1");
  if (dismissed) return null;

  return (
    <aside className="pulse-name-vote-card" aria-label="Vote for Pulse's new name">
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => { localStorage.setItem("pulse-name-vote-dismissed", "1"); setDismissed(true); }}
        className="absolute right-2 top-2 z-10 rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
      <h3>Vote for Pulse's new name!</h3>
      <img src={`${import.meta.env.BASE_URL}image.png`} alt="Vote for Pulse's new name" className="pulse-name-vote-image" />
      <p>We're thinking about giving Pulse a new name. Check out the ideas and let us know what you think!</p>
      <a href={HELP_URL} target="_blank" rel="noreferrer" className="pulse-name-vote-link">Open Pulse Help <span>→</span></a>
    </aside>
  );
}
