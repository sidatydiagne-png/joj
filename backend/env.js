// Charge le fichier .env AVANT les autres modules (db.js lit DATA_DIR à l'import)
import dotenv from "dotenv";
dotenv.config({ quiet: true });
