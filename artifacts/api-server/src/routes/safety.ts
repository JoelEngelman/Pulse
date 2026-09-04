import { Router } from "express";
import { and, eq } from "drizzle-orm";
import { db, userBlocksTable, safetyReportsTable, usersTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router = Router();
const allowedReasons = new Set(["harassment", "spam", "impersonation", "unsafe_contact", "child_safety", "sexual_content", "scam", "other"]);

router.get("/safety/blocks", requireAuth, async (req, res) => {
  const me = req.session.userId!;
  const rows = await db.select({ id: usersTable.id, username: usersTable.username, displayName: usersTable.displayName, avatarUrl: usersTable.avatarUrl })
    .from(userBlocksTable).innerJoin(usersTable, eq(usersTable.id, userBlocksTable.blockedId)).where(eq(userBlocksTable.blockerId, me));
  res.json(rows);
});

router.get("/safety/blocked/:userId", requireAuth, async (req, res) => {
  const me = req.session.userId!; const other = Number(req.params.userId);
  if (!Number.isInteger(other)) return res.status(400).json({ error: "Invalid user ID" });
  const [row] = await db.select().from(userBlocksTable).where(and(eq(userBlocksTable.blockerId, me), eq(userBlocksTable.blockedId, other))).limit(1);
  res.json({ blocked: Boolean(row) });
});

router.post("/safety/block/:userId", requireAuth, async (req, res) => {
  const me = req.session.userId!; const other = Number(req.params.userId);
  if (!Number.isInteger(other) || other === me) return res.status(400).json({ error: "Invalid user ID" });
  const [target] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.id, other)).limit(1);
  if (!target) return res.status(404).json({ error: "User not found" });
  await db.insert(userBlocksTable).values({ blockerId: me, blockedId: other }).onConflictDoNothing();
  res.json({ blocked: true });
});

router.delete("/safety/block/:userId", requireAuth, async (req, res) => {
  const me = req.session.userId!; const other = Number(req.params.userId);
  await db.delete(userBlocksTable).where(and(eq(userBlocksTable.blockerId, me), eq(userBlocksTable.blockedId, other)));
  res.json({ blocked: false });
});

router.post("/safety/report", requireAuth, async (req, res) => {
  const reporterId = req.session.userId!;
  const reportedUserId = req.body?.reportedUserId == null ? null : Number(req.body.reportedUserId);
  const messageId = req.body?.messageId == null ? null : Number(req.body.messageId);
  const reason = typeof req.body?.reason === "string" ? req.body.reason : "";
  const details = typeof req.body?.details === "string" ? req.body.details.trim().slice(0, 2000) : null;
  if (!allowedReasons.has(reason)) return res.status(400).json({ error: "Please choose a valid report reason." });
  if (reportedUserId === reporterId) return res.status(400).json({ error: "You cannot report yourself." });
  await db.insert(safetyReportsTable).values({ reporterId, reportedUserId: Number.isInteger(reportedUserId) ? reportedUserId : null, messageId: Number.isInteger(messageId) ? messageId : null, reason, details });
  res.status(201).json({ ok: true, message: "Thanks. Your report has been recorded for safety review." });
});

export default router;
