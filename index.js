import Database from "better-sqlite3";  // Import the better-sqlite3 module
import express from "express";  // Import the express module
import path from "path";  // Import the path module
import { fileURLToPath } from "url";  // Import the fileURLToPath function
import bodyParser from "body-parser"; // Import the body-parser module
import session from "express-session";  // Import the express-session module                                                   

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// SQLite Database Connection
const dbPath = path.join(__dirname, "shelterconnect.db");
const db = new Database(dbPath);

// Create Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user'
  );

  CREATE TABLE IF NOT EXISTS animals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    age INTEGER NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    image_path TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS adoption_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    animal_id INTEGER NOT NULL,
    request_status TEXT DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (animal_id) REFERENCES animals(id)
  );
`);

// Middleware
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  })
);
app.set("view engine", "ejs");

// Middleware for session validation
function ensureLoggedIn(req, res, next) {
  if (req.session && req.session.user) {
    next();
  } else {
    res.redirect("/login");
  }
}

function ensureStaff(req, res, next) {
  if (req.session && req.session.user && req.session.user.role === "staff") {
    next();
  } else {
    res.status(403).send("Access denied: You do not have permission.");
  }
}

// Routes

// Home Page
app.get("/", (req, res) => {
  res.render("index", { user: req.session.user || null });
});

// Signup Page (GET)
app.get("/signup", (req, res) => {
  res.render("signup", { error: null });
});

// Signup Form Submission (POST)
app.post("/signup", (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.render("signup", { error: "All fields must be filled." });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.render("signup", {
      error: "Please enter a valid email address.",
    });
  }

  if (password.length < 8) {
    return res.render("signup", {
      error: "Password must be at least 8 characters long.",
    });
  }

  try {
    const stmt = db.prepare(
      "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)"
    );
    stmt.run(username, email, password, "user");

    res.redirect("/login");
  } catch (err) {
    console.error("Error during signup:", err.message);
    res.render("signup", { error: "An error occurred during signup." });
  }
});

// Login Page (GET)
app.get("/login", (req, res) => {
  res.render("login", { error: null });
});

// Login Form Submission (POST)
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.render("login", { error: "All fields must be filled." });
  }

  try {
    const user = db.prepare("SELECT * FROM users WHERE email = ? AND password = ?").get(email, password);

    if (!user) {
      return res.render("login", { error: "Invalid email or password." });
    }

    req.session.user = user;

    if (user.role === "staff") {
      res.redirect("/staff_adoption");
    } else {
      res.redirect("/user_adoption");
    }
  } catch (err) {
    console.error("Error during login:", err.message);
    res.render("login", { error: "An error occurred during login." });
  }
});

// Logout Route
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err.message);
    }
    res.redirect("/login");
  });
});

// User Adoption Page
app.get("/user_adoption", ensureLoggedIn, (req, res) => {
  const { type } = req.query;

  let query = "SELECT * FROM animals";
  const params = [];

  if (type && type !== "all") {
    query += " WHERE type = ?";
    params.push(type);
  }

  try {
    const stmt = db.prepare(query);
    const animals = stmt.all(...params);
    res.render("user_adoption", { animals, filter: type || "all", user: req.session.user });
  } catch (err) {
    console.error("Error fetching animal data:", err.message);
    res.status(500).send("An error occurred while fetching animal data.");
  }
});

// Staff Adoption Page
app.get("/staff_adoption", ensureStaff, (req, res) => {
  const { type } = req.query;

  let query = "SELECT * FROM animals";
  const params = [];

  if (type && type !== "all") {
    query += " WHERE type = ?";
    params.push(type);
  }

  try {
    const stmt = db.prepare(query);
    const animals = stmt.all(...params);
    res.render("staff_adoption", { animals, filter: type || "all" });
  } catch (err) {
    console.error("Error fetching animal data:", err.message);
    res.status(500).send("An error occurred while fetching animal data.");
  }
});

// Apply for Adoption
app.post("/apply", (req, res) => {
  const { animal_id } = req.body;
  const user = req.session.user;
  
  if (!user || !animal_id) {
    return res.status(400).json({ error: "Missing user or pet ID." });
  }

  try {
    const stmt = db.prepare(
      "INSERT INTO adoption_requests (user_id, animal_id) VALUES (?, ?)"
    );
    stmt.run(user.id, animal_id);
    res.json({ message: "Adoption request successfully sent." });
  } catch (err) {
    console.error("Error creating adoption request:", err.message);
    res.status(500).json({ error: "An error occurred while creating the request." });
  }
});

// View Requests (Staff Only)
app.get("/requests", ensureStaff, (req, res) => {
  try {
    const requests = db.prepare(`
      SELECT ar.id, u.username, u.email, a.name AS pet_name, ar.request_status AS status
      FROM adoption_requests ar
      JOIN users u ON ar.user_id = u.id
      JOIN animals a ON ar.animal_id = a.id
    `).all();

    res.render("requests", { requests });
  } catch (err) {
    console.error("Error fetching requests:", err.message);
    res.status(500).send("An error occurred while fetching requests.");
  }
});

// Update Request Status
app.post("/update-request", ensureStaff, (req, res) => {
  const { requestId, status } = req.body;

  try {
    const stmt = db.prepare(
      "UPDATE adoption_requests SET request_status = ? WHERE id = ?"
    );
    stmt.run(status, requestId);
    res.json({ message: "Request status updated successfully." });
  } catch (err) {
    console.error("Error updating request status:", err.message);
    res.status(500).json({ error: "An error occurred while updating the request." });
  }
});

// Start Server
app.listen(port, () => {
  console.log(`Server is running on port ${port}.`);
});
