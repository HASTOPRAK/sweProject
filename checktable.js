import Database from "better-sqlite3";

const db = new Database("./shelterconnect.db");

try {
  const tableInfo = db.prepare("PRAGMA table_info(adoption_requests);").all();
  console.log("Adoption Requests Table Structure:");
  console.log(tableInfo);
} catch (err) {
  console.error("Error checking table info:", err.message);
} finally {
  db.close();
}
