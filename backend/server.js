require("dotenv").config();
const express = require("express");
const admin = require("firebase-admin");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// --- CONFIGURATION & INIT ---

// Initialize Firebase
// Ensure GOOGLE_APPLICATION_CREDENTIALS is set in .env pointing to your JSON file
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  storageBucket: process.env.FIREBASE_BUCKET_URL,
});

const db = admin.firestore();
const bucket = admin.storage().bucket();
const app = express();

// --- MIDDLEWARE ---

// Security Headers
app.use(helmet());

// CORS Configuration (Restrict this in production!)
app.use(
  cors({
    origin: "*", // TODO: Change this to your frontend URL (e.g., "https://myapp.com")
    methods: ["GET", "POST", "PUT"],
  }),
);

// Body Parsing
app.use(express.json({ limit: "10mb" }));

// Rate Limiting (Prevent Brute Force & DB Flooding)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use(apiLimiter);

// --- HELPERS ---

const uploadBase64Image = async (base64String, destinationPath) => {
  try {
    // Basic validation
    if (!base64String || !base64String.includes("base64")) return null;

    const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3)
      throw new Error("Invalid input string");

    const type = matches[1];
    const buffer = Buffer.from(matches[2], "base64");
    const file = bucket.file(destinationPath);

    await file.save(buffer, {
      metadata: { contentType: type },
      public: true, // Note: Ensure your bucket IAM allows public reads
    });

    return `https://storage.googleapis.com/${bucket.name}/${destinationPath}`;
  } catch (error) {
    console.error("Image Upload Error:", error);
    throw new Error("Failed to upload image");
  }
};

// --- ENDPOINTS ---

/**
 * GET /tag/:tagId
 * Fetches tag status.
 * WARNING: This implementation "Lazy Creates" tags.
 * An attacker could flood your DB by requesting random IDs.
 */
app.get("/tag/:tagId", async (req, res) => {
  const { tagId } = req.params;

  try {
    const tagRef = db.collection("tags").doc(tagId);
    const tagDoc = await tagRef.get();

    // 1. Tag doesn't exist? Create a fresh unassigned one.
    if (!tagDoc.exists) {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const hashedCode = await bcrypt.hash(code, 10);

      await tagRef.set({
        verificationCode: hashedCode,
        tempCode: code, // In prod, consider not storing plain text tempCode after printing it physically
        isSetup: false,
        pageData: {},
        ownerId: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return res.json({ status: "new", isSetup: false, code });
    }

    const tagData = tagDoc.data();

    // 2. Tag exists but is already claimed/owned
    if (tagData.ownerId) {
      // If the owner is viewing this, the frontend should handle the redirect to login/edit
      return res.json({
        status: "claimed",
        isSetup: tagData.isSetup,
        ownerId: tagData.ownerId,
      });
    }

    // 3. Tag exists but is unclaimed (waiting for setup)
    return res.json({
      status: "unclaimed",
      isSetup: false,
      code: tagData.tempCode,
    });
  } catch (err) {
    console.error(`Error fetching tag ${tagId}:`, err);
    res.status(500).json({ error: "Server error processing tag" });
  }
});

/**
 * POST /claim-tag
 * Atomic transaction to claim a tag.
 */
app.post("/claim-tag", async (req, res) => {
  const { tagId, code, email, password, isExistingUser } = req.body;

  if (!tagId || !code || !email) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // use a Transaction to ensure no one else claims it while we are checking
    const result = await db.runTransaction(async (t) => {
      const tagRef = db.collection("tags").doc(tagId);
      const tagDoc = await t.get(tagRef);

      if (!tagDoc.exists) throw new Error("TAG_NOT_FOUND");

      const tagData = tagDoc.data();

      // Check if already owned
      if (tagData.ownerId) throw new Error("TAG_ALREADY_CLAIMED");

      // Verify Code
      const isMatch = await bcrypt.compare(code, tagData.verificationCode);
      if (!isMatch) throw new Error("INVALID_CODE");

      let uid;

      // Handle User Logic
      if (isExistingUser) {
        try {
          const userRecord = await admin.auth().getUserByEmail(email);
          uid = userRecord.uid;
        } catch (e) {
          throw new Error("USER_NOT_FOUND");
        }
      } else {
        try {
          const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName: "New User",
          });
          uid = userRecord.uid;
        } catch (e) {
          throw new Error("EMAIL_IN_USE"); // Simplify auth errors for transaction block
        }
      }

      // Claim the tag
      t.update(tagRef, {
        ownerId: uid,
        // We do NOT set isSetup: true yet. They claimed it, but haven't saved their profile.
        claimedAt: admin.firestore.FieldValue.serverTimestamp(),
        // Optional: Remove tempCode now for security
        tempCode: admin.firestore.FieldValue.delete()
      });

      return { uid };
    });

    res.json({ message: "Tag claimed successfully", uid: result.uid });
  } catch (err) {
    console.error("Claim Transaction Error:", err.message);

    // Map internal errors to HTTP responses
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

/**
 * POST /save-page
 * Authenticated endpoint to save profile data.
 */
app.post("/save-page", async (req, res) => {
  const { token, tagId, pageData, profilePicBase64, coverPhotoBase64 } =
    req.body;

  if (!token || !tagId) {
    return res.status(400).json({ error: "Missing token or tagId" });
  }

  try {
    // Verify ID Token
    const decodedToken = await admin.auth().verifyIdToken(token);
    const userId = decodedToken.uid;

    const tagRef = db.collection("tags").doc(tagId);
    const tagDoc = await tagRef.get();

    // Authorization Check: Does this user own this tag?
    if (!tagDoc.exists || tagDoc.data().ownerId !== userId) {
      return res.status(403).json({ error: "Unauthorized access to this tag" });
    }

    const parsedPageData =
      typeof pageData === "string" ? JSON.parse(pageData) : pageData;

    // Updated: Handle image uploads
    let profilePicUrl = null;
    let coverPhotoUrl = null;

    if (profilePicBase64) {
      try {
        profilePicUrl = await uploadBase64Image(
          profilePicBase64,
          `profiles/${userId}/profile.jpg`,
        );
      } catch (error) {
        console.error("Profile pic upload failed:", error);
        // Continue without failing the whole request
      }
    }

    if (coverPhotoBase64) {
      try {
        coverPhotoUrl = await uploadBase64Image(
          coverPhotoBase64,
          `profiles/${userId}/cover.jpg`,
        );
      } catch (error) {
        console.error("Cover photo upload failed:", error);
      }
    }

    // Updated: Add URLs to pageData
    if (profilePicUrl) parsedPageData.profilePic = profilePicUrl;
    if (coverPhotoUrl) parsedPageData.coverPhoto = coverPhotoUrl;

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

/**
 * GET /card/:tagId
 * Public endpoint to fetch the profile card.
 */
app.get("/card/:tagId", async (req, res) => {
  try {
    const tagDoc = await db.collection("tags").doc(req.params.tagId).get();

    if (!tagDoc.exists) {
      return res.status(404).json({ error: "Tag not found" });
    }

    const data = tagDoc.data();

    if (!data.isSetup) {
      // You might want to return a specific code here so the frontend can show a "Not Setup Yet" screen
      return res
        .status(404)
        .json({ error: "Profile not set up yet", code: "NOT_SETUP" });
    }

    res.json(data.pageData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
