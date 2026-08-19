// server.js
// Entry point for the WeCare Health Threat Detection backend.
// Boots Express + Socket.IO for the live healthcare security platform.

require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcryptjs");

const db = require("./database/database");

const createAuthRoutes = require("./routes/authRoutes");
const createActivityRoutes = require("./routes/activityRoutes");
const createAdminRoutes = require("./routes/adminRoutes");
const createCommunicationRoutes = require("./routes/communicationRoutes");
const createMlRoutes = require("./routes/mlRoutes");
const createEvidenceRoutes = require("./routes/evidenceRoutes");

const {
  startEvidenceVault
} = require("./evidenceVaultServer");

const {
  initSocket,
  emitDoctorLogin
} = require("./services/socketService");


/* =========================================================
   Express App
========================================================= */

const app = express();

const PORT = process.env.PORT || 3000;


/* =========================================================
   Hackathon Demo Accounts
========================================================= */

const phase15Users = [
  {
    username: "admin",
    password: "WeCareAdmin@2026#A91K",
    full_name: "Security Administrator",
    role: "admin",
    doctor_id: null,
    department: null
  },

  {
    username: "doctor",
    password: "WeCareDoctor@2026#D71M",
    full_name: "Dr. Arjun Kumar",
    role: "doctor",
    doctor_id: "DOC001",
    department: "Cardiology"
  },

  {
    username: "doctor123",
    password: "WeCareDoc123@2026#K82P",
    full_name: "Dr. Arjun Kumar",
    role: "doctor",
    doctor_id: "DOC001",
    department: "Cardiology"
  },

  {
    username: "doctor456",
    password: "WeCareDoc456@2026#N34R",
    full_name: "Dr. Priya Sharma",
    role: "doctor",
    doctor_id: "DOC002",
    department: "Neurology"
  },

  {
    username: "doctor789",
    password: "WeCareDoc789@2026#T56X",
    full_name: "Dr. Rahul Nair",
    role: "doctor",
    doctor_id: "DOC003",
    department: "Orthopedics"
  },

  {
    username: "doctor000",
    password: "WeCareDoc000@2026#V73Q",
    full_name: "Dr. Meera Joseph",
    role: "doctor",
    doctor_id: "DOC004",
    department: "Radiology"
  }
];


/* =========================================================
   Create / Update Demo Accounts
========================================================= */

(async () => {
  try {
    for (const user of phase15Users) {
      const hash = await bcrypt.hash(
        user.password,
        10
      );

      db.run(
        `
        INSERT INTO users(
          username,
          password_hash,
          full_name,
          role,
          doctor_id,
          department
        )
        VALUES (?, ?, ?, ?, ?, ?)

        ON CONFLICT(username)
        DO UPDATE SET
          password_hash = excluded.password_hash,
          full_name = excluded.full_name,
          role = excluded.role,
          doctor_id = excluded.doctor_id,
          department = excluded.department
        `,
        [
          user.username,
          hash,
          user.full_name,
          user.role,
          user.doctor_id,
          user.department
        ],
        error => {
          if (error) {
            console.error(
              `Demo account update failed for ${user.username}:`,
              error.message
            );
          }
        }
      );
    }

    console.log(
      "Hackathon demo accounts initialized"
    );
  } catch (error) {
    console.error(
      "Demo account initialization error:",
      error
    );
  }
})();


/* =========================================================
   Demo Mode
   Clear stale account restrictions after restart
========================================================= */

db.run(
  `
  UPDATE account_restrictions
  SET status = 'Cleared'
  WHERE status = 'Active'
  `,
  error => {
    if (error) {
      console.warn(
        "Restriction reset warning:",
        error.message
      );
    }
  }
);


/* =========================================================
   Express Configuration
========================================================= */

// Required when running behind Render / reverse proxies.
app.set(
  "trust proxy",
  true
);

app.use(
  cors()
);

app.use(
  express.json({
    limit: "40mb"
  })
);


/* =========================================================
   Frontend Vendor Libraries
========================================================= */

app.use(
  "/vendor/html2canvas",
  express.static(
    path.join(
      __dirname,
      "node_modules",
      "html2canvas",
      "dist"
    )
  )
);

app.use(
  "/vendor/rrweb",
  express.static(
    path.join(
      __dirname,
      "node_modules",
      "rrweb",
      "dist"
    )
  )
);

app.use(
  "/vendor/rrweb-player",
  express.static(
    path.join(
      __dirname,
      "node_modules",
      "rrweb-player"
    )
  )
);


/* =========================================================
   Main Frontend
========================================================= */

app.use(
  express.static(
    path.join(
      __dirname,
      "public"
    )
  )
);


/* =========================================================
   Health Check
========================================================= */

app.get(
  "/api/health",
  (_req, res) => {
    res.json({
      success: true,
      status: "ok",
      service: "WeCare",
      time: new Date().toISOString()
    });
  }
);


/* =========================================================
   HTTP + Socket.IO Server
========================================================= */

const server = http.createServer(app);

const io = initSocket(server);


/* =========================================================
   Authentication Routes
========================================================= */

app.use(
  "/api/auth",
  createAuthRoutes(
    io,
    emitDoctorLogin
  )
);


/* =========================================================
   Doctor Activity Routes
========================================================= */

app.use(
  "/api/activity",
  createActivityRoutes(io)
);


/* =========================================================
   Admin Routes
========================================================= */

app.use(
  "/api/admin",
  createAdminRoutes(io)
);


/* =========================================================
   Communication / Export Routes
========================================================= */

app.use(
  "/api/communication",
  createCommunicationRoutes(io)
);


/* =========================================================
   Machine Learning Routes
========================================================= */

app.use(
  "/api/ml",
  createMlRoutes(io)
);


/* =========================================================
   Evidence Routes
========================================================= */

app.use(
  "/api/evidence",
  createEvidenceRoutes(io)
);


/* =========================================================
   Unknown API Routes
========================================================= */

app.use(
  "/api",
  (_req, res) => {
    res
      .status(404)
      .json({
        success: false,
        message: "API route not found"
      });
  }
);


/* =========================================================
   Start Main WeCare Server
========================================================= */

server.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      "Database connected"
    );

    console.log(
      "Socket.IO initialized"
    );

    console.log(
      `Server running on http://0.0.0.0:${PORT}`
    );

    /*
      Start the local Evidence Vault only when this project
      is running as the main WeCare application.

      The separate Render Evidence Vault service runs
      evidenceVaultServer.js directly.
    */

    try {
      startEvidenceVault();
    } catch (error) {
      console.error(
        "Evidence Vault startup error:",
        error.message
      );
    }
  }
);


/* =========================================================
   Graceful Shutdown
========================================================= */

process.on(
  "SIGINT",
  () => {
    console.log(
      "\nShutting down server..."
    );

    io.close(() => {
      server.close(() => {
        db.close(() => {
          process.exit(0);
        });
      });
    });
  }
);


process.on(
  "SIGTERM",
  () => {
    console.log(
      "\nRender requested shutdown..."
    );

    io.close(() => {
      server.close(() => {
        db.close(() => {
          process.exit(0);
        });
      });
    });
  }
);
