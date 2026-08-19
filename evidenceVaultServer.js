const express = require("express");
const path = require("path");

const {
  listIncidents,
  getIncident,
  getDismissals,
  readFileSafe,
  dbPath,
  vaultRoot
} = require("./services/evidenceService");


/* =========================================================
   Evidence Officer Basic Authentication
========================================================= */

function basic(req, res, next) {
  const user =
    process.env.EVIDENCE_OFFICER_USER || "officer";

  const pass =
    process.env.EVIDENCE_OFFICER_PASSWORD || "officer123";

  const header = req.headers.authorization || "";

  if (!header.startsWith("Basic ")) {
    res.set(
      "WWW-Authenticate",
      'Basic realm="Evidence Vault"'
    );

    return res
      .status(401)
      .send("Evidence Officer login required");
  }

  try {
    const decoded = Buffer
      .from(header.slice(6), "base64")
      .toString();

    const separatorIndex = decoded.indexOf(":");

    const username =
      separatorIndex >= 0
        ? decoded.slice(0, separatorIndex)
        : decoded;

    const password =
      separatorIndex >= 0
        ? decoded.slice(separatorIndex + 1)
        : "";

    if (username !== user || password !== pass) {
      res.set(
        "WWW-Authenticate",
        'Basic realm="Evidence Vault"'
      );

      return res
        .status(401)
        .send("Invalid Evidence Officer credentials");
    }

    next();
  } catch (error) {
    res.set(
      "WWW-Authenticate",
      'Basic realm="Evidence Vault"'
    );

    return res
      .status(401)
      .send("Invalid Evidence Officer credentials");
  }
}


/* =========================================================
   Start Evidence Vault Server
========================================================= */

function startEvidenceVault() {
  const app = express();

  /*
    IMPORTANT:

    If this file is executed directly by Render:
        node evidenceVaultServer.js

    -> use Render's PORT
    -> bind to 0.0.0.0

    If this file is imported by server.js:
        require("./evidenceVaultServer")

    -> keep the Vault on internal localhost:8080
  */

  const standalone = require.main === module;

  const port = standalone
    ? Number(process.env.PORT || 8080)
    : Number(process.env.EVIDENCE_VAULT_PORT || 8080);

  const host = standalone
    ? "0.0.0.0"
    : "127.0.0.1";


  /* =========================================================
     Authentication
  ========================================================= */

  app.use(basic);


  /* =========================================================
     rrweb Static Assets
  ========================================================= */

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
     Evidence Vault Frontend
  ========================================================= */

  app.use(
    express.static(
      path.join(
        __dirname,
        "evidence-vault-public"
      )
    )
  );


  /* =========================================================
     Get All Incidents
  ========================================================= */

  app.get(
    "/api/incidents",
    async (_req, res) => {
      try {
        const incidents =
          await listIncidents();

        res.json({
          success: true,
          incidents
        });
      } catch (error) {
        console.error(
          "Evidence Vault list incidents error:",
          error
        );

        res.status(500).json({
          success: false,
          message:
            "Unable to load evidence incidents"
        });
      }
    }
  );


  /* =========================================================
     Get Single Incident
  ========================================================= */

  app.get(
    "/api/incidents/:code",
    async (req, res) => {
      try {
        const row =
          await getIncident(
            req.params.code
          );

        if (!row) {
          return res.status(404).json({
            success: false,
            message:
              "Incident not found"
          });
        }

        const dismissals =
          await getDismissals(
            req.params.code
          );

        res.json({
          success: true,
          incident: row,
          dismissals
        });
      } catch (error) {
        console.error(
          "Evidence Vault incident error:",
          error
        );

        res.status(500).json({
          success: false,
          message:
            "Unable to load incident"
        });
      }
    }
  );


  /* =========================================================
     Serve Evidence Files
  ========================================================= */

  app.get(
    "/api/incidents/:code/file/:name",
    async (req, res) => {
      try {
        const row =
          await getIncident(
            req.params.code
          );

        if (!row) {
          return res.sendStatus(404);
        }

        const file =
          readFileSafe(
            row,
            req.params.name
          );

        const name =
          req.params.name.toLowerCase();

        if (name.endsWith(".png")) {
          res.type("png");
        } else if (
          name.endsWith(".jpg") ||
          name.endsWith(".jpeg")
        ) {
          res.type("jpg");
        } else if (
          name.endsWith(".webm")
        ) {
          res.type("video/webm");
        } else if (
          name.endsWith(".html")
        ) {
          res.type("html");
        } else if (
          name.endsWith(".json")
        ) {
          res.type("json");
        } else {
          res.type(
            "application/octet-stream"
          );
        }

        res.send(file);

      } catch (error) {
        console.error(
          "Evidence file error:",
          error.message
        );

        res
          .status(404)
          .send(
            "Evidence file not found"
          );
      }
    }
  );


  /* =========================================================
     Health Check
  ========================================================= */

  app.get(
    "/api/health",
    (_req, res) => {
      res.json({
        success: true,
        service:
          "WeCare Evidence Vault",
        database: dbPath,
        vault: vaultRoot
      });
    }
  );


  /* =========================================================
     Start Server
  ========================================================= */

  const server =
    app.listen(
      port,
      host,
      () => {
        console.log(
          `Evidence Vault running on http://${host}:${port}`
        );
      }
    );


  server.on(
    "error",
    (error) => {
      console.error(
        `Evidence Vault startup error on ${host}:${port}:`,
        error.message
      );
    }
  );


  return server;
}


/* =========================================================
   Export for Main WeCare Server
========================================================= */

module.exports = {
  startEvidenceVault
};


/* =========================================================
   Direct Execution for Separate Render Service
========================================================= */

if (require.main === module) {
  startEvidenceVault();
}
