import { Router } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db, notificationsTable, usersTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/notifications", requireAuth, async (req, res) => {
  const rows = await db.select({ notification: notificationsTable, actor: usersTable })
    .from(notificationsTable)
    .leftJoin(usersTable, eq(notificationsTable.actorId, usersTable.id))
    .where(eq(notificationsTable.userId, req.session.userId!))
    .orderBy(desc(notificationsTable.createdAt)).limit(50);
  res.json(rows.map(r => ({ ...r.notification, actor: r.actor ? { id: r.actor.id, username: r.actor.username, displayName: r.actor.displayName, avatarUrl: r.actor.avatarUrl } : null })));
});

router.post("/notifications/read", requireAuth, async (req, res) => {
  await db.update(notificationsTable).set({ read: true }).where(and(eq(notificationsTable.userId, req.session.userId!), eq(notificationsTable.read, false)));
  res.json({ ok: true });
});

router.delete("/notifications/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid notification ID" });
  await db.delete(notificationsTable).where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, req.session.userId!)));
  res.json({ ok: true });
});

export default router;
