import { Router } from "express";
import { asc, desc, eq, ilike } from "drizzle-orm";
import { db, communitiesTable, communityMembersTable, usersTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/communities", requireAuth, async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const rows = await db.select({ community: communitiesTable, owner: usersTable })
    .from(communitiesTable).innerJoin(usersTable, eq(communitiesTable.ownerId, usersTable.id))
    .where(q ? ilike(communitiesTable.name, `%${q.replace(/[%_\\]/g, "")}%`) : undefined)
    .orderBy(desc(communitiesTable.createdAt)).limit(50);
  const counts = await Promise.all(rows.map(async r => ({ id: r.community.id, count: (await db.select().from(communityMembersTable).where(eq(communityMembersTable.communityId, r.community.id))).length })));
  res.json(rows.map(r => ({ ...r.community, owner: { id:r.owner.id, username:r.owner.username, displayName:r.owner.displayName, avatarUrl:r.owner.avatarUrl }, memberCount: counts.find(c=>c.id===r.community.id)?.count ?? 0 })));
});

router.post("/communities", requireAuth, async (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim().slice(0,60) : "";
  const description = typeof req.body?.description === "string" ? req.body.description.trim().slice(0,500) : "";
  if (!/^[A-Za-z0-9][A-Za-z0-9 _-]{2,59}$/.test(name)) return res.status(400).json({ error:"Community names must be 3-60 characters and use letters, numbers, spaces, _ or -." });
  try {
    const [community] = await db.insert(communitiesTable).values({ name, description, ownerId:req.session.userId! }).returning();
    await db.insert(communityMembersTable).values({ communityId:community.id, userId:req.session.userId!, role:"owner" });
    res.status(201).json({ ...community, memberCount:1 });
  } catch { res.status(409).json({ error:"That community name is already taken." }); }
});

router.post("/communities/:id/join", requireAuth, async (req,res)=>{
  const id=Number(req.params.id); if(!Number.isInteger(id)) return res.status(400).json({error:"Invalid community ID"});
  const [community]=await db.select().from(communitiesTable).where(eq(communitiesTable.id,id)).limit(1); if(!community)return res.status(404).json({error:"Community not found"});
  await db.insert(communityMembersTable).values({communityId:id,userId:req.session.userId!}).onConflictDoNothing(); res.json({joined:true});
});

router.delete("/communities/:id/join", requireAuth, async(req,res)=>{const id=Number(req.params.id); await db.delete(communityMembersTable).where(eq(communityMembersTable.communityId,id)); res.json({joined:false});});

router.get("/communities/:id/members", requireAuth, async(req,res)=>{const id=Number(req.params.id);const rows=await db.select({user:usersTable,member:communityMembersTable}).from(communityMembersTable).innerJoin(usersTable,eq(communityMembersTable.userId,usersTable.id)).where(eq(communityMembersTable.communityId,id)).orderBy(asc(communityMembersTable.joinedAt)).limit(100);res.json(rows.map(r=>({id:r.user.id,username:r.user.username,displayName:r.user.displayName,avatarUrl:r.user.avatarUrl,role:r.member.role})));});

export default router;
