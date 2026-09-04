import { Router } from "express";
import { db, conversationsTable, conversationParticipantsTable, usersTable, notificationsTable } from "@workspace/db";
import { eq, and, inArray } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

router.post("/groups", requireAuth, async (req,res) => {
  const me=req.session.userId!;
  const name=typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const ids=Array.isArray(req.body?.participantIds) ? req.body.participantIds.map(Number).filter(Number.isInteger) : [];
  if(name.length<1 || name.length>80) return res.status(400).json({error:"Group name must be 1-80 characters."});
  const uniqueIds=[...new Set([me,...ids])];
  if(uniqueIds.length<3) return res.status(400).json({error:"A group needs at least 3 people."});
  if(uniqueIds.length>100) return res.status(400).json({error:"Groups can have up to 100 people."});
  const users=await db.select({id:usersTable.id}).from(usersTable).where(inArray(usersTable.id,uniqueIds));
  if(users.length!==uniqueIds.length) return res.status(400).json({error:"One or more users could not be found."});
  const [conv]=await db.insert(conversationsTable).values({name,isGroup:1,createdBy:me}).returning();
  await db.insert(conversationParticipantsTable).values(uniqueIds.map(userId=>({conversationId:conv.id,userId})));
  res.status(201).json({id:conv.id,name:conv.name,isGroup:true,participantIds:uniqueIds});
});

router.post("/conversations/:conversationId/members", requireAuth, async (req,res) => {
  const me=req.session.userId!; const id=Number(req.params.conversationId); const userId=Number(req.body?.userId);
  if(!Number.isInteger(id)||!Number.isInteger(userId)) return res.status(400).json({error:"Invalid ID"});
  const [conv]=await db.select().from(conversationsTable).where(eq(conversationsTable.id,id)).limit(1);
  if(!conv?.isGroup) return res.status(404).json({error:"Group not found"});
  const [admin]=await db.select().from(conversationParticipantsTable).where(and(eq(conversationParticipantsTable.conversationId,id),eq(conversationParticipantsTable.userId,me))).limit(1);
  if(!admin) return res.status(403).json({error:"You are not in this group."});
  const [target]=await db.select().from(usersTable).where(eq(usersTable.id,userId)).limit(1);
  if(!target) return res.status(404).json({error:"User not found"});
  await db.insert(conversationParticipantsTable).values({conversationId:id,userId}).onConflictDoNothing();
  res.json({ok:true});
});

router.delete("/conversations/:conversationId/members/me", requireAuth, async (req,res) => {
  const me=req.session.userId!; const id=Number(req.params.conversationId);
  if(!Number.isInteger(id)) return res.status(400).json({error:"Invalid conversation ID"});
  await db.delete(conversationParticipantsTable).where(and(eq(conversationParticipantsTable.conversationId,id),eq(conversationParticipantsTable.userId,me)));
  res.json({ok:true});
});

export default router;
