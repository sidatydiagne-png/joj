import "./env.js";
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

// Tout ce qui doit être sauvegardé (base + photos) vit dans DATA_DIR
const DATA_DIR = path.resolve(process.env.DATA_DIR || "./data");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

export const db = new Database(path.join(DATA_DIR, "dakar-accueil.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

const now = "strftime('%Y-%m-%dT%H:%M:%SZ','now')";

db.exec(`
CREATE TABLE IF NOT EXISTS lost_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  place TEXT NOT NULL,
  date TEXT,
  type TEXT NOT NULL CHECK (type IN ('perdu','trouve')),
  email TEXT NOT NULL,
  photo TEXT,
  created_at TEXT NOT NULL DEFAULT (${now})
);
CREATE TABLE IF NOT EXISTS item_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER NOT NULL REFERENCES lost_items(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (${now})
);
CREATE TABLE IF NOT EXISTS help_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  contact TEXT NOT NULL,
  subject TEXT NOT NULL CHECK (subject IN ('aide','probleme','autre')),
  message TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (${now})
);
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  date TEXT,
  place TEXT,
  type TEXT NOT NULL CHECK (type IN ('competition','culture','public'))
);
CREATE TABLE IF NOT EXISTS sites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  x REAL NOT NULL,
  y REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  kind TEXT CHECK (kind IN ('horaires','circulation','meteo')),
  created_at TEXT NOT NULL DEFAULT (${now})
);
`);

// Les 3 sites de départ du thème WordPress (Dakar / Diamniadio / Saly)
if (db.prepare("SELECT COUNT(*) AS n FROM sites").get().n === 0) {
  const add = db.prepare("INSERT INTO sites (title, description, x, y) VALUES (?, ?, ?, ?)");
  add.run("Dakar", "Cœur historique et sites urbains, accès via BRT/TER, taxis et navettes JOJ.", 145, 195);
  add.run("Diamniadio", "Pôle urbain nouveau à environ 30 km de Dakar, relié par le TER. Stade principal et village olympique.", 255, 205);
  add.run("Saly", "Station balnéaire sur la Petite Côte, à environ 80 km de Dakar. Sites nautiques et hébergements.", 380, 230);
}
