import "./env.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import multer from "multer";
import nodemailer from "nodemailer";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { db, UPLOAD_DIR } from "./db.js";

/* ================= CONFIG ================= */
const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || "127.0.0.1";
const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",").map((s) => s.trim().replace(/\/$/, "")).filter(Boolean);
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";

if (ADMIN_TOKEN.length < 16) {
  console.warn("⚠️  ADMIN_TOKEN absent ou trop court (16 caractères minimum) : la page /admin est désactivée.");
}

const mailer = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    })
  : null;
if (!mailer) console.warn("ℹ️  SMTP non configuré : les messages sont enregistrés mais aucun e-mail n'est envoyé.");

async function sendMail({ to, subject, text, replyTo, bcc }) {
  if (!mailer || !to) return false;
  try {
    await mailer.sendMail({ from: process.env.MAIL_FROM || process.env.SMTP_USER, to, subject, text, replyTo, bcc });
    return true;
  } catch (err) {
    console.error("Envoi d'e-mail impossible :", err.message);
    return false;
  }
}

/* ================= OUTILS DE VALIDATION ================= */
// Texte nettoyé : espaces retirés, caractères de contrôle supprimés, longueur limitée
const str = (v, max) =>
  typeof v === "string" ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, max) : "";
const isEmail = (v) => v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
const isDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
const CATEGORIES = ["Document", "Électronique", "Vêtement", "Bagage", "Autre"];
const bad = (res, msg = "Merci de remplir les champs obligatoires.") => res.status(400).json({ error: msg });

/* ================= PHOTOS ================= */
const MIME_EXT = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif" };
const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) => cb(null, crypto.randomUUID() + MIME_EXT[file.mimetype]),
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 12 },
  fileFilter: (req, file, cb) => (MIME_EXT[file.mimetype] ? cb(null, true) : cb(new Error("BAD_FILE_TYPE"))),
});

// Le type MIME envoyé par le navigateur peut être falsifié : on vérifie les premiers octets du fichier
function looksLikeImage(filePath) {
  const fd = fs.openSync(filePath, "r");
  const b = Buffer.alloc(12);
  fs.readSync(fd, b, 0, 12, 0);
  fs.closeSync(fd);
  const jpeg = b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  const png = b.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  const gif = b.subarray(0, 4).toString("latin1") === "GIF8";
  const webp = b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP";
  return jpeg || png || gif || webp;
}
const removeFile = (name) => {
  if (name) fs.rm(path.join(UPLOAD_DIR, path.basename(name)), { force: true }, () => {});
};

/* ================= APP ================= */
const app = express();
app.set("trust proxy", 1); // derrière Nginx : récupère la vraie IP des visiteurs (limites de débit)
app.disable("x-powered-by");

// crossOriginResourcePolicy "cross-origin" : indispensable pour que le site Vercel puisse afficher les photos
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin(origin, cb) {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      cb(new Error("ORIGIN_NOT_ALLOWED"));
    },
    methods: ["GET", "POST", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "20kb" }));

const limiter = (minutes, limit, error) =>
  rateLimit({ windowMs: minutes * 60 * 1000, limit, standardHeaders: true, legacyHeaders: false, message: { error } });
const generalLimiter = limiter(1, 150, "Trop de tentatives. Réessayez dans quelques minutes.");
const postLimiter = limiter(60, 15, "Trop de tentatives. Réessayez dans quelques minutes.");
const contactLimiter = limiter(60, 6, "Trop de tentatives. Réessayez dans quelques minutes.");
const helpLimiter = limiter(60, 6, "Trop de tentatives. Réessayez dans quelques minutes.");
// Seuls les essais de connexion ratés (401) comptent : 10 erreurs / 15 min / IP
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  requestWasSuccessful: (req, res) => res.statusCode !== 401,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de tentatives. Réessayez dans quelques minutes." },
});
app.use("/api", generalLimiter);

/* ================= PHOTOS PUBLIQUES ================= */
app.use("/uploads", express.static(UPLOAD_DIR, { dotfiles: "deny", index: false, maxAge: "7d" }));

/* ================= API PUBLIQUE ================= */
app.get("/api/health", (req, res) => res.json({ ok: true }));

// Objets perdus : l'e-mail du déclarant n'est JAMAIS renvoyé (colonnes listées explicitement)
const publicItem = (r) => ({
  id: r.id, title: r.title, category: r.category, place: r.place, date: r.date,
  type: r.type, photo: r.photo ? `/uploads/${r.photo}` : null, createdAt: r.created_at,
});
app.get("/api/lost-items", (req, res) => {
  const rows = db
    .prepare("SELECT id, title, category, place, date, type, photo, created_at FROM lost_items ORDER BY id DESC LIMIT 50")
    .all();
  res.json(rows.map(publicItem));
});

app.post("/api/lost-items", postLimiter, upload.single("photo"), (req, res) => {
  const file = req.file;
  const b = req.body || {};
  if (str(b.website, 100)) { removeFile(file?.filename); return res.status(201).json({ id: 0 }); } // piège à robots

  const title = str(b.title, 120);
  const place = str(b.place, 120);
  const email = str(b.email, 254).toLowerCase();
  const category = CATEGORIES.includes(b.category) ? b.category : "Autre";
  const type = b.type === "trouve" ? "trouve" : "perdu";
  const date = isDate(str(b.date, 10)) ? str(b.date, 10) : null;

  if (!title || !place || !isEmail(email)) { removeFile(file?.filename); return bad(res); }
  if (file && !looksLikeImage(file.path)) {
    removeFile(file.filename);
    return bad(res, "Format de photo non accepté (JPG, PNG, WebP ou GIF).");
  }

  const info = db
    .prepare("INSERT INTO lost_items (title, category, place, date, type, email, photo) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(title, category, place, date, type, email, file?.filename ?? null);
  res.status(201).json({ id: Number(info.lastInsertRowid) });
});

// Mise en relation : le message est enregistré, puis transmis par e-mail au déclarant sans révéler son adresse
app.post("/api/lost-items/:id/contact", contactLimiter, async (req, res) => {
  const b = req.body || {};
  if (str(b.website, 100)) return res.json({ ok: true });

  const item = db.prepare("SELECT id, title, email FROM lost_items WHERE id = ?").get(Number(req.params.id));
  if (!item) return res.status(404).json({ error: "Déclaration introuvable." });

  const name = str(b.name, 80);
  const contact = str(b.contact, 120);
  const message = str(b.message, 2000);
  if (!name || !contact || !message) return bad(res);

  db.prepare("INSERT INTO item_messages (item_id, name, contact, message) VALUES (?, ?, ?, ?)").run(item.id, name, contact, message);

  await sendMail({
    to: item.email,
    bcc: ADMIN_EMAIL || undefined,
    replyTo: isEmail(contact) ? contact : undefined,
    subject: `Dakar Accueil 2026 — message au sujet de « ${item.title} »`,
    text: `De : ${name}\nContact : ${contact}\n\nConcernant l'objet : ${item.title} (#${item.id})\n\nMessage :\n${message}`,
  });
  res.json({ ok: true });
});

// Assistance : chaque demande reçoit un jeton aléatoire gardé dans le navigateur (pas de compte nécessaire)
app.post("/api/help-requests", helpLimiter, async (req, res) => {
  const b = req.body || {};
  if (str(b.website, 100)) return res.status(201).json({ token: crypto.randomUUID() });

  const name = str(b.name, 80);
  const contact = str(b.contact, 120);
  const subject = ["aide", "probleme", "autre"].includes(b.subject) ? b.subject : "autre";
  const message = str(b.message, 2000);
  if (!name || !contact || !message) return bad(res);

  const token = crypto.randomUUID();
  db.prepare("INSERT INTO help_requests (token, name, contact, subject, message) VALUES (?, ?, ?, ?, ?)")
    .run(token, name, contact, subject, message);

  await sendMail({
    to: ADMIN_EMAIL,
    replyTo: isEmail(contact) ? contact : undefined,
    subject: "Nouvelle demande d’assistance",
    text: `Nom : ${name}\nContact : ${contact}\nSujet : ${subject}\n\n${message}`,
  });
  res.status(201).json({ token });
});

app.post("/api/help-requests/mine", (req, res) => {
  const tokens = Array.isArray(req.body?.tokens)
    ? [...new Set(req.body.tokens.filter((t) => typeof t === "string" && /^[0-9a-f-]{36}$/i.test(t)))].slice(0, 20)
    : [];
  if (!tokens.length) return res.json([]);
  const rows = db
    .prepare(`SELECT token, name, subject, message, created_at FROM help_requests WHERE token IN (${tokens.map(() => "?").join(",")}) ORDER BY id DESC`)
    .all(...tokens);
  res.json(rows.map((r) => ({ token: r.token, name: r.name, subject: r.subject, message: r.message, createdAt: r.created_at })));
});

app.get("/api/events", (req, res) =>
  res.json(db.prepare("SELECT id, title, date, place, type FROM events ORDER BY date IS NULL, date ASC, id ASC").all())
);
app.get("/api/sites", (req, res) =>
  res.json(db.prepare("SELECT id, title, description, x, y FROM sites ORDER BY id").all())
);
app.get("/api/alerts", (req, res) =>
  res.json(
    db.prepare("SELECT id, title, body, kind, created_at FROM alerts ORDER BY id DESC LIMIT 10").all()
      .map((r) => ({ id: r.id, title: r.title, body: r.body, kind: r.kind, createdAt: r.created_at }))
  )
);

/* ================= ADMIN (remplace l'admin WordPress) ================= */
function requireAdmin(req, res, next) {
  if (ADMIN_TOKEN.length < 16) return res.status(503).json({ error: "Admin désactivée : ADMIN_TOKEN n'est pas configuré." });
  const given = (req.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const sha = (s) => crypto.createHash("sha256").update(s).digest();
  if (!crypto.timingSafeEqual(sha(given), sha(ADMIN_TOKEN))) return res.status(401).json({ error: "Jeton invalide." });
  next();
}
app.use("/api/admin", adminLimiter, requireAdmin);

app.get("/api/admin/check", (req, res) => res.json({ ok: true }));

app.get("/api/admin/lost-items", (req, res) => {
  const rows = db.prepare("SELECT * FROM lost_items ORDER BY id DESC LIMIT 200").all();
  res.json(rows.map((r) => ({ ...publicItem(r), email: r.email })));
});
app.get("/api/admin/messages", (req, res) =>
  res.json(
    db.prepare(
      `SELECT m.id, m.name, m.contact, m.message, m.created_at AS createdAt, i.title AS itemTitle
       FROM item_messages m JOIN lost_items i ON i.id = m.item_id ORDER BY m.id DESC LIMIT 200`
    ).all()
  )
);
app.get("/api/admin/help-requests", (req, res) =>
  res.json(
    db.prepare("SELECT id, name, contact, subject, message, created_at AS createdAt FROM help_requests ORDER BY id DESC LIMIT 200").all()
  )
);

app.post("/api/admin/events", (req, res) => {
  const b = req.body || {};
  const title = str(b.title, 160);
  const type = ["competition", "culture", "public"].includes(b.type) ? b.type : null;
  const date = isDate(str(b.date, 10)) ? str(b.date, 10) : null;
  if (!title || !type) return bad(res);
  const info = db.prepare("INSERT INTO events (title, date, place, type) VALUES (?, ?, ?, ?)").run(title, date, str(b.place, 160), type);
  res.status(201).json({ id: Number(info.lastInsertRowid) });
});
app.post("/api/admin/sites", (req, res) => {
  const b = req.body || {};
  const title = str(b.title, 120);
  const x = Number(b.x), y = Number(b.y);
  if (!title || !Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 480 || y < 0 || y > 360) {
    return bad(res, "Titre requis, X entre 0 et 480, Y entre 0 et 360.");
  }
  const info = db.prepare("INSERT INTO sites (title, description, x, y) VALUES (?, ?, ?, ?)").run(title, str(b.description, 1000), x, y);
  res.status(201).json({ id: Number(info.lastInsertRowid) });
});
app.post("/api/admin/alerts", (req, res) => {
  const b = req.body || {};
  const title = str(b.title, 160);
  const kind = ["horaires", "circulation", "meteo"].includes(b.kind) ? b.kind : null;
  if (!title) return bad(res);
  const info = db.prepare("INSERT INTO alerts (title, body, kind) VALUES (?, ?, ?)").run(title, str(b.body, 2000), kind);
  res.status(201).json({ id: Number(info.lastInsertRowid) });
});

// Suppression : la table vient d'une liste fixe (jamais directement de l'URL)
const DELETABLE = {
  events: "events", sites: "sites", alerts: "alerts",
  "help-requests": "help_requests", messages: "item_messages", "lost-items": "lost_items",
};
app.delete("/api/admin/:what/:id", (req, res) => {
  const table = DELETABLE[req.params.what];
  const id = Number(req.params.id);
  if (!table || !Number.isInteger(id)) return res.status(404).json({ error: "Introuvable." });
  if (table === "lost_items") removeFile(db.prepare("SELECT photo FROM lost_items WHERE id = ?").get(id)?.photo);
  const info = db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
  if (!info.changes) return res.status(404).json({ error: "Introuvable." });
  res.json({ ok: true });
});

/* ================= ERREURS ================= */
app.use((req, res) => res.status(404).json({ error: "Introuvable." }));
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") return res.status(413).json({ error: "Photo trop lourde (5 Mo maximum)." });
    return bad(res, "Envoi invalide.");
  }
  if (err.message === "BAD_FILE_TYPE") return bad(res, "Format de photo non accepté (JPG, PNG, WebP ou GIF).");
  if (err.message === "ORIGIN_NOT_ALLOWED") return res.status(403).json({ error: "Origine non autorisée." });
  if (err.type === "entity.parse.failed" || err.type === "entity.too.large") return bad(res, "Requête invalide.");
  console.error(err);
  res.status(500).json({ error: "Erreur serveur." });
});

app.listen(PORT, HOST, () => console.log(`✅ API Dakar Accueil 2026 sur http://${HOST}:${PORT}`));
