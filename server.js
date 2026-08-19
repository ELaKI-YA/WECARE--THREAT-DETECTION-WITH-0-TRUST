// server.js
// Entry point for the Health Threat Detection backend (Phase 1).
// Boots Express + Socket.IO for the simplified live-security MVP.

require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const path = require("path");

const db = require("./database/database");
const createAuthRoutes = require("./routes/authRoutes");
const createActivityRoutes = require("./routes/activityRoutes");
const createAdminRoutes = require("./routes/adminRoutes");
const createCommunicationRoutes = require("./routes/communicationRoutes");
const createMlRoutes = require("./routes/mlRoutes");
const createEvidenceRoutes = require("./routes/evidenceRoutes");
const { startEvidenceVault } = require("./evidenceVaultServer");
const { initSocket, emitDoctorLogin } = require("./services/socketService");

const app = express();
const PORT = process.env.PORT || 3000;

// Phase 15 hackathon demo accounts: created/updated automatically on every start.
const bcrypt = require("bcryptjs");
const phase15Users = [
  {username:"admin",password:"admin123",full_name:"Security Administrator",role:"admin",doctor_id:null,department:null},
  {username:"doctor",password:"doctor123",full_name:"Dr. Arjun Kumar",role:"doctor",doctor_id:"DOC001",department:"Cardiology"},
  {username:"doctor123",password:"doctor123",full_name:"Dr. Arjun Kumar",role:"doctor",doctor_id:"DOC001",department:"Cardiology"},
  {username:"doctor456",password:"doctor456",full_name:"Dr. Priya Sharma",role:"doctor",doctor_id:"DOC002",department:"Neurology"},
  {username:"doctor789",password:"doctor789",full_name:"Dr. Rahul Nair",role:"doctor",doctor_id:"DOC003",department:"Orthopedics"},
  {username:"doctor000",password:"doctor000",full_name:"Dr. Meera Joseph",role:"doctor",doctor_id:"DOC004",department:"Radiology"}
];
(async()=>{
  for(const u of phase15Users){
    const hash=await bcrypt.hash(u.password,10);
    db.run(`INSERT INTO users(username,password_hash,full_name,role,doctor_id,department)
      VALUES(?,?,?,?,?,?)
      ON CONFLICT(username) DO UPDATE SET password_hash=excluded.password_hash,full_name=excluded.full_name,role=excluded.role,doctor_id=excluded.doctor_id,department=excluded.department`,
      [u.username,hash,u.full_name,u.role,u.doctor_id,u.department]);
  }
})();


// Demo mode: clear stale restrictions so doctor access is always recoverable after restart.
db.run("UPDATE account_restrictions SET status='Cleared' WHERE status='Active'", (err) => {
  if (err) console.warn('Restriction reset warning:', err.message);
});

// Trust proxy headers so req.ip is accurate across LAN/reverse-proxy setups.
app.set("trust proxy", true);

app.use(cors());
app.use(express.json({ limit: "40mb" }));
app.use("/vendor/html2canvas", express.static(path.join(__dirname, "node_modules", "html2canvas", "dist")));
app.use("/vendor/rrweb", express.static(path.join(__dirname, "node_modules", "rrweb", "dist")));
app.use("/vendor/rrweb-player", express.static(path.join(__dirname, "node_modules", "rrweb-player")));
app.use(express.static(path.join(__dirname, "public")));

// Health check endpoint for quick network/uptime verification.
app.get("/api/health", (_req, res) => {
  res.json({ success: true, status: "ok", time: new Date().toISOString() });
});

// One HTTP server shared between Express and Socket.IO.
const server = http.createServer(app);
const io = initSocket(server);

// Wire auth routes with the Socket.IO instance so doctor logins are broadcast live.
app.use("/api/auth", createAuthRoutes(io, emitDoctorLogin));

// Phase 2: doctor activity + risk routes, and admin monitoring routes.
app.use("/api/activity", createActivityRoutes(io));
app.use("/api/admin", createAdminRoutes(io));
app.use("/api/communication", createCommunicationRoutes(io));
app.use("/api/ml", createMlRoutes(io));
app.use("/api/evidence", createEvidenceRoutes(io));

// Catch-all for unknown API routes (registered AFTER real routes).
app.use("/api", (_req, res) => {
  res.status(404).json({ success: false, message: "API route not found" });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("Database connected");
  console.log("Socket.IO initialized");
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  startEvidenceVault();
});

// Graceful shutdown on Ctrl+C.
process.on("SIGINT", () => {
  console.log("\nShutting down server...");
  io.close(() => {
    server.close(() => {
      db.close(() => process.exit(0));
    });
  });
});
