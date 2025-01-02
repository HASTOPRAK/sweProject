import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

// __dirname tanımlaması
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Veritabanı bağlantısı
const dbPath = path.join(__dirname, 'shelterconnect.db');
const db = new Database(dbPath);

// Kullanıcıları listele
try {
  const stmt = db.prepare('SELECT * FROM users');
  const users = stmt.all();

  if (users.length > 0) {
    console.log('Kayıtlı kullanıcılar:');
    console.table(users);
  } else {
    console.log('Hiç kullanıcı bulunamadı.');
  }
} catch (err) {
  console.error('Kullanıcılar listelenirken hata:', err.message);
} finally {
  db.close();
}
