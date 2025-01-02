// Jest mock tanımı (better-sqlite3)
jest.mock("better-sqlite3", () => {
    return jest.fn(() => ({
      prepare: jest.fn(() => ({
        all: jest.fn(() => [
          { id: 1, username: "testuser", email: "asdasd@hotmail.com", password: "123412341234", role: "user" },
          { id: 2, username: "staffuser", email: "1903bjk@hotmail.com", password: "123123123", role: "staff" },
        ]),
        run: jest.fn(() => ({ changes: 1 })),
      })),
      close: jest.fn(),
    }));
  });
  
  
  import request from "supertest";
  import app from "./index.js"; // Express uygulamanız
  import path from "path";
  import { fileURLToPath } from "url";
  
  // Jest için __filename ve __dirname tanımları
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  
  describe("Express Application", () => {
    describe("Home Page", () => {
      it("should render the home page", async () => {
        const res = await request(app).get("/");
        expect(res.statusCode).toBe(200);
        expect(res.text).toContain("<title>Home</title>");
      });
    });
  
    describe("Signup", () => {
      it("should render the signup page", async () => {
        const res = await request(app).get("/signup");
        expect(res.statusCode).toBe(200);
        expect(res.text).toContain("<form");
      });
  
      it("should successfully sign up a user", async () => {
        const res = await request(app).post("/signup").send({
          username: "testuser",
          email: "yusufHT@hotmail.com",
          password: "159357",
        });
        expect(res.statusCode).toBe(302); // Redirect
        expect(res.headers.location).toBe("/login");
      });
  
      it("should fail with missing fields", async () => {
        const res = await request(app).post("/signup").send({
          username: "",
          email: "",
          password: "",
        });
        expect(res.statusCode).toBe(200);
        expect(res.text).toContain("All fields must be filled.");
      });
    });
  
    describe("Login", () => {
      it("should render the login page", async () => {
        const res = await request(app).get("/login");
        expect(res.statusCode).toBe(200);
        expect(res.text).toContain("<form");
      });
  
      it("should successfully log in a user", async () => {
        const res = await request(app).post("/login").send({
          email: "asdasd@hotmail.com",
          password: "123412341234",
        });
        expect(res.statusCode).toBe(302); // Redirect
      });
  
      it("should fail with invalid credentials", async () => {
        const res = await request(app).post("/login").send({
          email: "wrong@example.com",
          password: "wrongpassword",
        });
        expect(res.statusCode).toBe(200);
        expect(res.text).toContain("Invalid email or password.");
      });
    });
  
    describe("User Adoption Page", () => {
      it("should render the user adoption page for logged-in users", async () => {
        const loginRes = await request(app).post("/login").send({
          email: "asdasd@hotmail.com",
          password: "123412341234",
        });
  
        const cookie = loginRes.headers["set-cookie"];
  
        const res = await request(app)
          .get("/user_adoption")
          .set("Cookie", cookie);
  
        expect(res.statusCode).toBe(200);
        expect(res.text).toContain("<h1>Available Animals</h1>");
      });
  
      it("should redirect to login if user is not logged in", async () => {
        const res = await request(app).get("/user_adoption");
        expect(res.statusCode).toBe(302);
        expect(res.headers.location).toBe("/login");
      });
    });
  
    describe("Staff Adoption Page", () => {
      it("should render the staff adoption page for staff users", async () => {
        const loginRes = await request(app).post("/login").send({
          email: "1903bjk@hotmail.com",
          password: "123123123",
        });
  
        const cookie = loginRes.headers["set-cookie"];
  
        const res = await request(app)
          .get("/staff_adoption")
          .set("Cookie", cookie);
  
        expect(res.statusCode).toBe(200);
        expect(res.text).toContain("<h1>Staff Adoption Dashboard</h1>");
      });
  
      it("should deny access if user is not staff", async () => {
        const loginRes = await request(app).post("/login").send({
          email: "testuser@example.com",
          password: "testpassword123",
        });
  
        const cookie = loginRes.headers["set-cookie"];
  
        const res = await request(app)
          .get("/staff_adoption")
          .set("Cookie", cookie);
  
        expect(res.statusCode).toBe(403);
        expect(res.text).toContain("Access denied: You do not have permission.");
      });
    });
  
    describe("Apply for Adoption", () => {
      it("should allow logged-in users to apply for adoption", async () => {
        const loginRes = await request(app).post("/login").send({
          email: "asdasd@hotmail.com",
          password: "123412341234",
        });
  
        const cookie = loginRes.headers["set-cookie"];
  
        const res = await request(app)
          .post("/apply")
          .set("Cookie", cookie)
          .send({ animal_id: 1 });
  
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe("Adoption request successfully sent.");
      });
  
      it("should fail if user is not logged in", async () => {
        const res = await request(app).post("/apply").send({ animal_id: 1 });
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe("Missing user or pet ID.");
      });
    });
  });
  