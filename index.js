import express from "express";
const app = express();
const port = 3000;

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render("index.ejs", {});
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.get("/signup", (req, res) => {
  res.render("signup.ejs");
});

app.get("/adoptation", (req, res) => {
  res.render("adoption.ejs");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}.`);
});
