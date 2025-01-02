import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Veritabanı bağlantısını oluştur
const dbPath = path.join(__dirname, "shelterconnect.db");
const db = new Database(dbPath);

try {
  // adoption_requests tablosunu kontrol et
  const requests = db.prepare(`
    SELECT 
      ar.id AS request_id,
      u.username AS user_name,
      u.email AS user_email,
      a.name AS animal_name,
      a.type AS animal_type,
      a.age AS animal_age
    FROM adoption_requests ar
    JOIN users u ON ar.user_id = u.id
    JOIN animals a ON ar.animal_id = a.id
  `).all();

  console.log("Adoption Requests:", requests);
} catch (err) {
  console.error("Error fetching adoption requests:", err.message);
}

// Veritabanı bağlantısını kapat
db.close();
