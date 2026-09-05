import { Router } from "express";
import { and, desc, eq, sql } from "drizzle-orm";
import { db, followsTable, notificationsTable, usersTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";
import { toPublicUser } from "../lib/userHelpers";

const router = Router();

router.post("/users/:userId/follow", requireAuth, async (req, res) => {
  const me = req.session.userId!;
  const targetId = Number(req.params.userId);
  if (!Number.isInteger(targetId)) return res.status(400).json({ error: "Invalid user ID" });
  if (targetId === me) return res.status(400).json({ error: "You cannot follow yourself." });

  const [target] = await db.select().from(usersTable).where(eq(usersTable.id, targetId)).limit(1);
  if (!target) return res.status(404).json({ error: "User not found" });

  const inserted = await db.insert(followsTable)
    .values({ followerId: me, followingId: targetId })
    .onConflictDoNothing()
    .returning();

  if (inserted.length) {
    const [actor] = await db.select().from(usersTable).where(eq(usersTable.id, me)).limit(1);
    if (actor) {
      await db.insert(notificationsTable).values({
        userId: targetId,
        actorId: me,
        type: "follow",
        message: `${actor.displayName} followed you`,
        link: `/users/${me}`,
      });
    }
  }

  res.json({ following: true });
});

router.delete("/users/:userId/follow", requireAuth, async (req, res) => {
  const me = req.session.userId!;
  const targetId = Number(req.params.userId);
  if (!Number.isInteger(targetId)) return res.status(400).json({ error: "Invalid user ID" });
  await db.delete(followsTable).where(and(eq(followsTable.followerId, me), eq(followsTable.followingId, targetId)));
  res.json({ following: false });
});

router.get("/users/:userId/followers", requireAuth, async (req, res) => {
  const id = Number(req.params.userId);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid user ID" });
  const rows = await db.select({ user: usersTable })
    .from(followsTable)
    .innerJoin(usersTable, eq(followsTable.followerId, usersTable.id))
    .where(eq(followsTable.followingId, id))
    .orderBy(desc(followsTable.createdAt))
    .limit(100);
  res.json(rows.map((r) => toPublicUser(r.user)));
});

router.get("/users/:userId/following", requireAuth, async (req, res) => {
  const id = Number(req.params.userId);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid user ID" });
  const rows = await db.select({ user: usersTable })
    .from(followsTable)
    .innerJoin(usersTable, eq(followsTable.followingId, usersTable.id))
    .where(eq(followsTable.followerId, id))
    .orderBy(desc(followsTable.createdAt))
    .limit(100);
  res.json(rows.map((r) => toPublicUser(r.user)));
});

router.get("/users/:userId/follow-status", requireAuth, async (req, res) => {
  const me = req.session.userId!;
  const id = Number(req.params.userId);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid user ID" });

  const [row] = await db.select().from(followsTable)
    .where(and(eq(followsTable.followerId, me), eq(followsTable.followingId, id))).limit(1);
  const [followers] = await db.select({ count: sql<number>`count(*)` }).from(followsTable).where(eq(followsTable.followingId, id));
  const [following] = await db.select({ count: sql<number>`count(*)` }).from(followsTable).where(eq(followsTable.followerId, id));

  res.json({
    following: !!row,
    followers: Number(followers?.count ?? 0),
    followingCount: Number(following?.count ?? 0),
  });
});

export default router;
