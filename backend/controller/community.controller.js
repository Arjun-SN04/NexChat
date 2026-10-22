import { Community } from "../models/community.model.js"
import { Group } from "../models/group.model.js"
import { emitToUsers } from "../utils/notify.js"
import { MEMBER_FIELDS, broadcastGroup, destroyGroup, groupView } from "./group.controller.js"

const MAX_MEMBERS = 1000
const sameId = (a, b) => String(a?._id ?? a) === String(b?._id ?? b)
const has = (list, id) => list.some((x) => sameId(x, id))
const fail = (res, status, error) => res.status(status).json({ error })

// A community as the signed-in user sees it: its groups, and which ones they're in
const communityView = async (c, me) => {
  const groups = await Group.find({ community: c._id }).select("name description announcement members updatedAt").sort({ announcement: -1, name: 1 })
  return {
    _id: c._id,
    isCommunity: true,
    name: c.name,
    fullName: c.name,
    description: c.description,
    members: c.members,
    admins: c.admins,
    createdBy: c.createdBy,
    announcements: c.announcements,
    createdAt: c.createdAt,
    groups: groups.map((g) => ({
      _id: g._id,
      name: g.name,
      description: g.description,
      announcement: g.announcement,
      memberCount: g.members.length,
      joined: has(g.members, me),
    })),
  }
}

const loadMemberCommunity = async (req, res) => {
  const c = await Community.findById(req.params.id)
  if (!c) return fail(res, 404, "Community not found")
  if (!has(c.members, req.user._id)) return fail(res, 403, "You're not in this community")
  return c
}

const isAdmin = (c, userId) => has(c.admins, userId)
const changed = (c) => emitToUsers(c.members, "communityUpdated", { communityId: String(c._id) })

export const listCommunities = async (req, res) => {
  try {
    const list = await Community.find({ members: req.user._id }).sort({ name: 1 })
    res.status(200).json({ communities: await Promise.all(list.map((c) => communityView(c, req.user._id))) })
  } catch (error) {
    console.log("listCommunities error:", error)
    fail(res, 500, "Internal server error")
  }
}

export const getCommunity = async (req, res) => {
  try {
    const c = await loadMemberCommunity(req, res)
    if (!c?._id) return
    await c.populate("members", MEMBER_FIELDS)
    res.status(200).json(await communityView(c, req.user._id))
  } catch (error) {
    console.log("getCommunity error:", error)
    fail(res, 500, "Internal server error")
  }
}

// Create a community with its Announcements group
export const createCommunity = async (req, res) => {
  try {
    const me = req.user
    const name = String(req.body.name || "").trim()
    if (!name) return fail(res, 400, "Give the community a name")
    const ids = Array.isArray(req.body.memberIds) ? req.body.memberIds : []
    const others = [...new Set(ids.filter((id) => has(me.contacts, id) && !sameId(id, me._id)).map(String))]
    const members = [me._id, ...others]

    const community = await Community.create({
      name,
      description: String(req.body.description || "").trim(),
      members,
      admins: [me._id],
      createdBy: me._id,
    })
    const now = new Date()
    const announcements = await Group.create({
      name: "Announcements",
      description: `Updates for everyone in ${name}`,
      members,
      admins: [me._id],
      createdBy: me._id,
      community: community._id,
      announcement: true,
      reads: Object.fromEntries(members.map((id) => [String(id), now])),
    })
    community.announcements = announcements._id
    await community.save()

    const group = await Group.findById(announcements._id).populate("members", MEMBER_FIELDS).populate("community", "name")
    emitToUsers(others, "groupAdded", groupView(group))
    emitToUsers(others, "communityUpdated", { communityId: String(community._id) })
    res.status(201).json(await communityView(community, me._id))
  } catch (error) {
    console.log("createCommunity error:", error)
    fail(res, 500, "Internal server error")
  }
}

export const updateCommunity = async (req, res) => {
  try {
    const c = await loadMemberCommunity(req, res)
    if (!c?._id) return
    if (!isAdmin(c, req.user._id)) return fail(res, 403, "Only admins can edit the community")
    if (req.body.name !== undefined) {
      const name = String(req.body.name).trim()
      if (!name) return fail(res, 400, "Give the community a name")
      c.name = name
    }
    if (req.body.description !== undefined) c.description = String(req.body.description).trim()
    await c.save()
    changed(c)
    // Group rows show the community name
    const groups = await Group.find({ community: c._id }).select("_id")
    await Promise.all(groups.map((g) => broadcastGroup(g._id)))
    res.status(200).json(await communityView(c, req.user._id))
  } catch (error) {
    console.log("updateCommunity error:", error)
    fail(res, 500, "Internal server error")
  }
}

// Add my contacts to the community (and its Announcements group)
export const addCommunityMembers = async (req, res) => {
  try {
    const c = await loadMemberCommunity(req, res)
    if (!c?._id) return
    if (!isAdmin(c, req.user._id)) return fail(res, 403, "Only admins can add people")
    const ids = [...new Set((Array.isArray(req.body.userIds) ? req.body.userIds : [])
      .filter((id) => has(req.user.contacts, id) && !has(c.members, id)).map(String))]
    if (!ids.length) return fail(res, 400, "No one to add")
    if (c.members.length + ids.length > MAX_MEMBERS) return fail(res, 400, `Communities can have up to ${MAX_MEMBERS} people`)

    c.members.push(...ids)
    await c.save()
    if (c.announcements) {
      const now = new Date()
      await Group.updateOne(
        { _id: c.announcements },
        { $addToSet: { members: { $each: ids } }, $set: Object.fromEntries(ids.map((id) => [`reads.${id}`, now])) },
      )
      const full = await broadcastGroup(c.announcements)
      emitToUsers(ids, "groupAdded", groupView(full))
    }
    changed(c)
    res.status(200).json(await communityView(c, req.user._id))
  } catch (error) {
    console.log("addCommunityMembers error:", error)
    fail(res, 500, "Internal server error")
  }
}

// Remove someone (admins) or leave (anyone): also takes them out of every group in it
export const removeCommunityMember = async (req, res) => {
  try {
    const c = await loadMemberCommunity(req, res)
    if (!c?._id) return
    const target = req.params.userId
    const leaving = sameId(target, req.user._id)
    if (!leaving && !isAdmin(c, req.user._id)) return fail(res, 403, "Only admins can remove people")
    if (!has(c.members, target)) return fail(res, 404, "Not in this community")

    c.members = c.members.filter((m) => !sameId(m, target))
    c.admins = c.admins.filter((a) => !sameId(a, target))
    if (!c.members.length) return deleteEverything(c, res)
    if (!c.admins.length) c.admins = [c.members[0]]
    await c.save()

    const groups = await Group.find({ community: c._id, members: target })
    for (const g of groups) {
      g.members = g.members.filter((m) => !sameId(m, target))
      g.admins = g.admins.filter((a) => !sameId(a, target))
      g.reads.delete(String(target))
      if (!g.members.length) { await destroyGroup(g); continue }
      if (!g.admins.length) g.admins = g.announcement ? c.admins : [g.members[0]]
      await g.save()
      emitToUsers([target], "groupRemoved", { groupId: String(g._id) })
      await broadcastGroup(g._id)
    }
    emitToUsers([target], "communityRemoved", { communityId: String(c._id) })
    changed(c)
    res.status(200).json({ removed: target })
  } catch (error) {
    console.log("removeCommunityMember error:", error)
    fail(res, 500, "Internal server error")
  }
}

export const setCommunityAdmin = async (req, res) => {
  try {
    const c = await loadMemberCommunity(req, res)
    if (!c?._id) return
    if (!isAdmin(c, req.user._id)) return fail(res, 403, "Only admins can change admins")
    const target = req.params.userId
    if (!has(c.members, target)) return fail(res, 404, "Not in this community")
    const makeAdmin = req.body.admin !== false
    if (makeAdmin && !isAdmin(c, target)) c.admins.push(target)
    if (!makeAdmin) {
      if (c.admins.length === 1 && isAdmin(c, target)) return fail(res, 400, "A community needs at least one admin")
      c.admins = c.admins.filter((a) => !sameId(a, target))
    }
    await c.save()
    // Community admins are the ones who can post announcements
    if (c.announcements) {
      await Group.updateOne({ _id: c.announcements }, { $set: { admins: c.admins } })
      await broadcastGroup(c.announcements)
    }
    changed(c)
    res.status(200).json(await communityView(c, req.user._id))
  } catch (error) {
    console.log("setCommunityAdmin error:", error)
    fail(res, 500, "Internal server error")
  }
}

// New group inside the community (admins). Others can join it from the community page.
export const createCommunityGroup = async (req, res) => {
  try {
    const c = await loadMemberCommunity(req, res)
    if (!c?._id) return
    if (!isAdmin(c, req.user._id)) return fail(res, 403, "Only admins can add groups")
    const name = String(req.body.name || "").trim()
    if (!name) return fail(res, 400, "Give the group a name")
    const ids = Array.isArray(req.body.memberIds) ? req.body.memberIds : []
    const members = [req.user._id, ...new Set(ids.filter((id) => has(c.members, id) && !sameId(id, req.user._id)).map(String))]
    const now = new Date()
    const group = await Group.create({
      name,
      description: String(req.body.description || "").trim(),
      members,
      admins: [req.user._id],
      createdBy: req.user._id,
      community: c._id,
      reads: Object.fromEntries(members.map((id) => [String(id), now])),
    })
    const full = await Group.findById(group._id).populate("members", MEMBER_FIELDS).populate("community", "name")
    emitToUsers(full.members, "groupAdded", groupView(full), req.user._id)
    changed(c)
    res.status(201).json(groupView(full))
  } catch (error) {
    console.log("createCommunityGroup error:", error)
    fail(res, 500, "Internal server error")
  }
}

const deleteEverything = async (c, res) => {
  const groups = await Group.find({ community: c._id })
  for (const g of groups) await destroyGroup(g)
  await Community.deleteOne({ _id: c._id })
  emitToUsers(c.members, "communityRemoved", { communityId: String(c._id) })
  return res.status(200).json({ deleted: String(c._id) })
}

export const deleteCommunity = async (req, res) => {
  try {
    const c = await loadMemberCommunity(req, res)
    if (!c?._id) return
    if (!isAdmin(c, req.user._id)) return fail(res, 403, "Only admins can delete the community")
    return deleteEverything(c, res)
  } catch (error) {
    console.log("deleteCommunity error:", error)
    fail(res, 500, "Internal server error")
  }
}
