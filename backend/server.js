require("dotenv").config();
const express = require("express");
const admin = require("firebase-admin");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// --- CONFIGURATION & INIT ---

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  storageBucket: process.env.FIREBASE_BUCKET_URL,
});

const db = admin.firestore();
// const bucket = admin.storage().bucket();
const app = express();

// --- MIDDLEWARE ---

app.use(helmet());

// ⚠️ PRODUCTION: replace * with your actual frontend URL
// e.g. origin: "https://yourapp.com"
app.use(
  cors({
    origin: function (origin, callback) {
      const allowed = [
        "http://localhost:3000",
        "https://quickly.com", // your production domain
      ];
      if (!origin || allowed.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT"],
  })
);

app.use(express.json({ limit: "10mb" }));

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
});
app.use(apiLimiter);

// Stricter limiter for admin routes
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many admin requests, please try again later.",
});

// --- HELPER ---
const requireAdmin = (req, res) => {
  if (req.headers["x-admin-secret"] !== process.env.ADMIN_SECRET) {
    res.status(403).json({ error: "Unauthorized" });
    return false;
  }
  return true;
};

// --- ENDPOINTS ---

// ── POST /admin/login ──────────────────────────────────────
// Validates the admin secret. Frontend calls this on login.
// The secret never needs to be stored on the frontend.
app.post("/admin/login", adminLimiter, (req, res) => {
  if (!requireAdmin(req, res)) return;
  res.json({ ok: true });
});

// ── GET /admin/tags ────────────────────────────────────────
app.get("/admin/tags", adminLimiter, async (req, res) => {
  if (!requireAdmin(req, res)) return;

  try {
    const snapshot = await db.collection("tags").get();
    const tags = snapshot.docs.map((doc) => ({
      tagId: doc.id,
      ...doc.data(),
      verificationCode: undefined, // never expose hashed code
      tempCode: undefined,         // never expose plain code
    }));
    res.json({ tags });
  } catch (err) {
    console.error("Error fetching tags:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── POST /admin/create-tag ─────────────────────────────────
app.post("/admin/create-tag", adminLimiter, async (req, res) => {
  if (!requireAdmin(req, res)) return;

  const tagId = req.body.tagId?.trim().toLowerCase();
  if (!tagId) return res.status(400).json({ error: "Tag ID required" });

  try {
    const tagRef = db.collection("tags").doc(tagId);
    const tagDoc = await tagRef.get();
    if (tagDoc.exists) return res.status(409).json({ error: "Tag already exists" });

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const hashedCode = await bcrypt.hash(code, 10);

    await tagRef.set({
      verificationCode: hashedCode,
      tempCode: code,
      isSetup: false,
      isActive: true,
      pageData: {},
      ownerId: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ message: "Tag created", tagId, code });
  } catch (err) {
    console.error("Error creating tag:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── POST /admin/deactivate-tag ─────────────────────────────
app.post("/admin/deactivate-tag", adminLimiter, async (req, res) => {
  if (!requireAdmin(req, res)) return;

  const tagId = req.body.tagId?.trim().toLowerCase();
  if (!tagId) return res.status(400).json({ error: "Tag ID required" });

  try {
    const tagRef = db.collection("tags").doc(tagId);
    const tagDoc = await tagRef.get();
    if (!tagDoc.exists) return res.status(404).json({ error: "Tag not found" });

    await tagRef.update({ isActive: false });
    res.json({ message: "Tag deactivated", tagId });
  } catch (err) {
    console.error("Error deactivating tag:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── POST /admin/reactivate-tag ─────────────────────────────
app.post("/admin/reactivate-tag", adminLimiter, async (req, res) => {
  if (!requireAdmin(req, res)) return;

  const tagId = req.body.tagId?.trim().toLowerCase();
  if (!tagId) return res.status(400).json({ error: "Tag ID required" });

  try {
    const tagRef = db.collection("tags").doc(tagId);
    const tagDoc = await tagRef.get();
    if (!tagDoc.exists) return res.status(404).json({ error: "Tag not found" });

    await tagRef.update({ isActive: true });
    res.json({ message: "Tag reactivated", tagId });
  } catch (err) {
    console.error("Error reactivating tag:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── GET /tag/:tagId ────────────────────────────────────────
app.get("/tag/:tagId", async (req, res) => {
  const tagId = req.params.tagId?.trim().toLowerCase();

  try {
    const tagRef = db.collection("tags").doc(tagId);
    const tagDoc = await tagRef.get();

    if (!tagDoc.exists) {
      return res.status(404).json({ error: "Tag not found" });
    }

    const tagData = tagDoc.data();

    if (tagData.isActive === false) {
      return res.status(200).json({ status: "deactivated" });
    }

    if (tagData.ownerId) {
      return res.json({
        status: "claimed",
        isSetup: tagData.isSetup,
        ownerId: tagData.ownerId,
      });
    }

    return res.json({
      status: "unclaimed",
      isSetup: false,
      code: tagData.tempCode,
    });
  } catch (err) {
    console.error(`Error fetching tag ${tagId}:`, err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── POST /claim-tag ────────────────────────────────────────
app.post("/claim-tag", async (req, res) => {
  const { tagId, code, email, password, isExistingUser } = req.body;

  if (!tagId || !code || !email) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const result = await db.runTransaction(async (t) => {
      const tagRef = db.collection("tags").doc(tagId);
      const tagDoc = await t.get(tagRef);

      if (!tagDoc.exists) throw new Error("TAG_NOT_FOUND");

      const tagData = tagDoc.data();

      if (tagData.ownerId) throw new Error("TAG_ALREADY_CLAIMED");

      const isMatch = await bcrypt.compare(code, tagData.verificationCode);
      if (!isMatch) throw new Error("INVALID_CODE");

      let uid;

      if (isExistingUser) {
        const userRecord = await admin.auth().getUserByEmail(email);
        uid = userRecord.uid;
      } else {
        const userRecord = await admin.auth().createUser({
          email,
          password,
          displayName: "New User",
        });
        uid = userRecord.uid;
      }

      t.update(tagRef, {
        ownerId: uid,
        claimedAt: admin.firestore.FieldValue.serverTimestamp(),
        tempCode: admin.firestore.FieldValue.delete(), // ✅ cleans up plain code
      });

      return { uid };
    });

    res.json({ message: "Tag claimed successfully", uid: result.uid });
  } catch (err) {
    console.error("Claim Transaction Error:", err.message);
    const errorMap = {
      TAG_NOT_FOUND: 404,
      TAG_ALREADY_CLAIMED: 409,
      INVALID_CODE: 401,
      USER_NOT_FOUND: 404,
      EMAIL_IN_USE: 400,
    };
    const status = errorMap[err.message] || 500;
    const msg = errorMap[err.message] ? err.message : "Internal Server Error";
    res.status(status).json({ error: msg });
  }
});

// ── POST /save-page ────────────────────────────────────────
app.post("/save-page", async (req, res) => {
  const { token, tagId, pageData, profilePic, coverPhoto } = req.body;

  if (!token || !tagId) return res.status(400).json({ error: "Missing token or tagId" });

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const userId = decodedToken.uid;

    const tagRef = db.collection("tags").doc(tagId);
    const tagDoc = await tagRef.get();

    if (!tagDoc.exists || tagDoc.data().ownerId !== userId) {
      return res.status(403).json({ error: "Unauthorized access to this tag" });
    }

    const parsedPageData = typeof pageData === "string" ? JSON.parse(pageData) : pageData;

    if (profilePic) parsedPageData.profilePic = profilePic;
    if (coverPhoto) parsedPageData.coverPhoto = coverPhoto;

    await tagRef.update({
      pageData: parsedPageData,
      isSetup: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ message: "Profile saved successfully" });
  } catch (err) {
    console.error("Save Page Error:", err);
    if (err.code && err.code.startsWith("auth/")) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    res.status(500).json({ error: "Failed to save page" });
  }
});

// ── GET /card/:tagId ───────────────────────────────────────
app.get("/card/:tagId", async (req, res) => {
  try {
    const tagDoc = await db.collection("tags").doc(req.params.tagId).get();

    if (!tagDoc.exists) {
      return res.status(404).json({ error: "Tag not found" });
    }

    const data = tagDoc.data();

    if (!data.isSetup) {
      return res.status(404).json({ error: "Profile not set up yet", code: "NOT_SETUP" });
    }

    res.json(data.pageData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// --- START SERVER ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
