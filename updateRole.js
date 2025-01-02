import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

// __dirname ve __filename tanımları
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Veritabanı bağlantısı
const dbPath = path.join(__dirname, 'shelterconnect.db');
const db = new Database(dbPath);

// Güncelleme işlemi
const email = 'kullanici_email@example.com'; // Güncellenecek kullanıcının emaili
const newRole = 'staff'; // Yeni rol

try {
  console.log('Güncelleme başlatılıyor...');
  const stmt = db.prepare('UPDATE users SET role = ? WHERE email = ?');
  const result = stmt.run(newRole, email);

  if (result.changes > 0) {
    console.log(`Kullanıcı başarıyla ${newRole} olarak güncellendi.`);
  } else {
    console.log('Kullanıcı bulunamadı.');
  }
} catch (err) {
  console.error('Hata:', err.message);
} finally {
  db.close();
}
export function updateRole(email, newRole) {
  const stmt = db.prepare("UPDATE users SET role = ? WHERE email = ?");
  const result = stmt.run(newRole, email);
  return result.changes > 0;
}

