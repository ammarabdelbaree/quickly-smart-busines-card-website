require("dotenv").config();
const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// ─── SUPABASE INIT ────────────────────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const app = express();

// ─── MIDDLEWARE ───────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL, methods: ["GET", "POST", "PUT"] }));
app.use(express.json({ limit: "1mb" }));

// ─── RATE LIMITERS ────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 100,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true, legacyHeaders: false,
});
app.use(apiLimiter);

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 20,
  message: "Too many admin requests, please try again later.",
  standardHeaders: true, legacyHeaders: false,
});

// ─── HELPERS ─────────────────────────────────────────────────
const requireAdmin = (req, res) => {
  const secret = req.headers["x-admin-secret"];
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    res.status(403).json({ error: "Unauthorized" });
    return false;
  }
  return true;
};

const isValidTagId = (id) => /^[a-z0-9-]{1,50}$/.test(id);

const validatePageData = (data) => {
  if (!data || typeof data !== "object") return false;
  const strFields = ["name", "title", "phone", "email", "description"];
  for (const field of strFields) {
    if (data[field] !== undefined && typeof data[field] !== "string") return false;
    if (typeof data[field] === "string" && data[field].length > 500) return false;
  }
  if (data.links !== undefined && !Array.isArray(data.links)) return false;
  if (Array.isArray(data.links) && data.links.length > 30) return false;
  return true;
};

const verifyToken = async (token) => {
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
};

// Extract storage bucket + path from a Supabase public URL
const parseStorageUrl = (url) => {
  if (!url || typeof url !== "string") return null;
  const marker = "/object/public/";
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  const rest = url.slice(idx + marker.length);
  const slash = rest.indexOf("/");
  if (slash === -1) return null;
  return { bucket: rest.slice(0, slash), path: rest.slice(slash + 1) };
};

// Delete a file from Supabase Storage by its public URL. Errors are non-fatal.
const deleteStorageFile = async (url) => {
  const parsed = parseStorageUrl(url);
  if (!parsed) return;
  const { error } = await supabase.storage.from(parsed.bucket).remove([parsed.path]);
  if (error) console.warn(`Storage delete warning (${parsed.bucket}/${parsed.path}):`, error.message);
};

// ─── HEALTH CHECK ─────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── ADMIN ENDPOINTS ─────────────────────────────────────────

app.post("/admin/login", adminLimiter, (req, res) => {
  if (!requireAdmin(req, res)) return;
  res.json({ ok: true });
});

app.get("/admin/tags", adminLimiter, async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const { data, error } = await supabase
      .from("tags")
      .select("id, is_active, is_setup, owner_id, created_at, page_data")
      .order("created_at", { ascending: false });
    if (error) throw error;
    const tags = data.map((row) => ({
      tagId: row.id,
      isActive: row.is_active,
      isSetup: row.is_setup,
      ownerId: row.owner_id,
      createdAt: row.created_at,
      phone: row.page_data?.phone || null,
    }));
    res.json({ tags });
  } catch (err) {
    console.error("Error fetching tags:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/admin/create-tag", adminLimiter, async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const tagId = req.body.tagId?.trim().toLowerCase();
  if (!tagId) return res.status(400).json({ error: "Tag ID required" });
  if (!isValidTagId(tagId)) return res.status(400).json({ error: "Invalid tag ID format." });
  try {
    const { data: existing } = await supabase.from("tags").select("id").eq("id", tagId).single();
    if (existing) return res.status(409).json({ error: "Tag already exists" });
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const hashedCode = await bcrypt.hash(code, 10);
    const { error } = await supabase.from("tags").insert({
      id: tagId, verification_code: hashedCode, temp_code: code,
      is_setup: false, is_active: true, page_data: {}, owner_id: null,
    });
    if (error) throw error;
    res.json({ message: "Tag created", tagId, code });
  } catch (err) {
    console.error("Error creating tag:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/admin/deactivate-tag", adminLimiter, async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const tagId = req.body.tagId?.trim().toLowerCase();
  if (!tagId || !isValidTagId(tagId)) return res.status(400).json({ error: "Invalid tag ID" });
  try {
    const { data, error } = await supabase.from("tags").update({ is_active: false }).eq("id", tagId).select("id").single();
    if (error || !data) return res.status(404).json({ error: "Tag not found" });
    res.json({ message: "Tag deactivated", tagId });
  } catch (err) {
    console.error("Error deactivating tag:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/admin/delete-tag", adminLimiter, async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const tagId = req.body.tagId?.trim().toLowerCase();
  if (!tagId || !isValidTagId(tagId)) return res.status(400).json({ error: "Invalid tag ID" });
  try {
    // Fetch page_data BEFORE deleting so we can clean up storage
    const { data: tag } = await supabase
      .from("tags").select("page_data").eq("id", tagId).single();

    const { data, error } = await supabase.from("tags").delete().eq("id", tagId).select("id").single();
    if (error || !data) return res.status(404).json({ error: "Tag not found" });

    // Delete photos after the row is gone (non-fatal)
    if (tag?.page_data) {
      await Promise.allSettled([
        deleteStorageFile(tag.page_data.profilePic),
        deleteStorageFile(tag.page_data.coverPhoto),
      ]);
    }

    res.json({ message: "Tag deleted", tagId });
  } catch (err) {
    console.error("Error deleting tag:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/admin/reactivate-tag", adminLimiter, async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const tagId = req.body.tagId?.trim().toLowerCase();
  if (!tagId || !isValidTagId(tagId)) return res.status(400).json({ error: "Invalid tag ID" });
  try {
    const { data, error } = await supabase.from("tags").update({ is_active: true }).eq("id", tagId).select("id").single();
    if (error || !data) return res.status(404).json({ error: "Tag not found" });
    res.json({ message: "Tag reactivated", tagId });
  } catch (err) {
    console.error("Error reactivating tag:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── PUBLIC ENDPOINTS ─────────────────────────────────────────

app.get("/tag/:tagId", async (req, res) => {
  const tagId = req.params.tagId?.trim().toLowerCase();
  if (!tagId || !isValidTagId(tagId)) return res.status(400).json({ error: "Invalid tag ID" });
  try {
    const { data, error } = await supabase
      .from("tags").select("is_active, is_setup, owner_id, temp_code").eq("id", tagId).single();
    if (error || !data) return res.status(404).json({ error: "Tag not found" });
    if (!data.is_active) return res.json({ status: "deactivated" });
    if (data.owner_id) return res.json({ status: "claimed", isSetup: data.is_setup, ownerId: data.owner_id });
    return res.json({ status: "unclaimed", isSetup: false, code: data.temp_code });
  } catch (err) {
    console.error(`Error fetching tag ${tagId}:`, err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/verify-code", async (req, res) => {
  const { tagId, code } = req.body;
  if (!tagId || !code) return res.status(400).json({ error: "Missing required fields" });
  if (!isValidTagId(tagId)) return res.status(400).json({ error: "Invalid tag ID" });
  try {
    const { data: tag, error: tagError } = await supabase
      .from("tags").select("owner_id, verification_code").eq("id", tagId).single();
    if (tagError || !tag) return res.status(404).json({ error: "TAG_NOT_FOUND" });
    if (tag.owner_id) return res.status(409).json({ error: "TAG_ALREADY_CLAIMED" });
    const isMatch = await bcrypt.compare(code.trim().toUpperCase(), tag.verification_code);
    if (!isMatch) return res.status(401).json({ error: "INVALID_CODE" });
    res.json({ ok: true });
  } catch (err) {
    console.error("Verify code error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/claim-tag", async (req, res) => {
  const { tagId, code, email, password, isExistingUser } = req.body;
  if (!tagId || !code || !email) return res.status(400).json({ error: "Missing required fields" });
  if (!isValidTagId(tagId)) return res.status(400).json({ error: "Invalid tag ID" });
  if (typeof email !== "string" || !email.includes("@")) return res.status(400).json({ error: "Invalid email" });
  if (!isExistingUser && (typeof password !== "string" || password.length < 6)) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }
  try {
    const { data: tag, error: tagError } = await supabase
      .from("tags").select("owner_id, verification_code").eq("id", tagId).single();
    if (tagError || !tag) return res.status(404).json({ error: "TAG_NOT_FOUND" });
    if (tag.owner_id) return res.status(409).json({ error: "TAG_ALREADY_CLAIMED" });
    const isMatch = await bcrypt.compare(code.trim().toUpperCase(), tag.verification_code);
    if (!isMatch) return res.status(401).json({ error: "INVALID_CODE" });
    let userId;
    if (isExistingUser) {
      const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) throw listError;
      const existing = users.find((u) => u.email === email.toLowerCase());
      if (!existing) return res.status(404).json({ error: "USER_NOT_FOUND" });
      userId = existing.id;
    } else {
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: email.toLowerCase(),
        password,
        email_confirm: true,
      });
      if (createError) {
        if (createError.message.includes("already")) return res.status(400).json({ error: "EMAIL_IN_USE" });
        throw createError;
      }
      userId = newUser.user.id;
    }
    const { error: updateError } = await supabase
      .from("tags")
      .update({
        owner_id: userId,
        claimed_at: new Date().toISOString(),
        temp_code: null,
        verification_code: null,
      })
      .eq("id", tagId);
    if (updateError) throw updateError;
    res.json({ message: "Tag claimed successfully", uid: userId });
  } catch (err) {
    console.error("Claim error:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /save-page
app.post("/save-page", async (req, res) => {
  const { token, tagId, pageData, profilePic, coverPhoto } = req.body;
  if (!token || !tagId) return res.status(400).json({ error: "Missing token or tagId" });
  if (!isValidTagId(tagId)) return res.status(400).json({ error: "Invalid tag ID" });

  const parsedPageData = typeof pageData === "string" ? JSON.parse(pageData) : pageData;
  if (!validatePageData(parsedPageData)) return res.status(400).json({ error: "Invalid page data" });

  try {
    const user = await verifyToken(token);
    if (!user) return res.status(401).json({ error: "Invalid or expired token" });

    // Single query: get owner + existing page_data
    const { data: tag, error: tagError } = await supabase
      .from("tags").select("owner_id, page_data").eq("id", tagId).single();

    if (tagError || !tag || tag.owner_id !== user.id) {
      return res.status(403).json({ error: "Unauthorized access to this tag" });
    }

    const oldData = tag.page_data || {};
    const oldProfilePic = oldData.profilePic || null;
    const oldCoverPhoto = oldData.coverPhoto || null;

    // profilePic/coverPhoto rules:
    //   typeof === "string"  →  new URL (upload or unchanged) → save it, delete old if different
    //   null / undefined     →  no file picked → keep existing URL, do NOT delete

    if (typeof profilePic === "string") {
      parsedPageData.profilePic = profilePic;
      if (oldProfilePic && oldProfilePic !== profilePic) {
            await deleteStorageFile(oldProfilePic);
      }
    } else {
        if (oldProfilePic) parsedPageData.profilePic = oldProfilePic;
    }

    if (typeof coverPhoto === "string") {
      parsedPageData.coverPhoto = coverPhoto;
      if (oldCoverPhoto && oldCoverPhoto !== coverPhoto) {
            await deleteStorageFile(oldCoverPhoto);
      }
    } else {
        if (oldCoverPhoto) parsedPageData.coverPhoto = oldCoverPhoto;
    }

    const { error: updateError } = await supabase
      .from("tags")
      .update({ page_data: parsedPageData, is_setup: true, updated_at: new Date().toISOString() })
      .eq("id", tagId);

    if (updateError) throw updateError;
    res.json({ message: "Profile saved successfully" });
  } catch (err) {
    console.error("Save Page Error:", err);
    res.status(500).json({ error: "Failed to save page" });
  }
});

// GET /card/:tagId
app.get("/card/:tagId", async (req, res) => {
  const tagId = req.params.tagId?.trim().toLowerCase();
  if (!tagId || !isValidTagId(tagId)) return res.status(400).json({ error: "Invalid tag ID" });
  try {
    const { data, error } = await supabase
      .from("tags").select("is_setup, page_data").eq("id", tagId).single();
    if (error || !data) return res.status(404).json({ error: "Tag not found" });
    if (!data.is_setup) return res.status(404).json({ error: "Profile not set up yet", code: "NOT_SETUP" });
    res.json(data.page_data);
  } catch (err) {
    console.error("Error fetching card:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /edit-data/:tagId
app.get("/edit-data/:tagId", async (req, res) => {
  const tagId = req.params.tagId?.trim().toLowerCase();
  if (!tagId || !isValidTagId(tagId)) return res.status(400).json({ error: "Invalid tag ID" });
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing token" });
  try {
    const user = await verifyToken(token);
    if (!user) return res.status(401).json({ error: "Invalid or expired token" });
    const { data, error } = await supabase
      .from("tags").select("owner_id, page_data").eq("id", tagId).single();
    if (error || !data) return res.status(404).json({ error: "Tag not found" });
    if (data.owner_id !== user.id) return res.status(403).json({ error: "Unauthorized" });
    res.json(data.page_data || {});
  } catch (err) {
    console.error("Error fetching edit data:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── START ────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
