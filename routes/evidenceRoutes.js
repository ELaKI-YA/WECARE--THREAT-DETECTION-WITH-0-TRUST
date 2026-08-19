const express = require('express');
const jwt = require('jsonwebtoken');
const { saveEvidence } = require('../services/evidenceService');


/* =========================================================
   Authentication
========================================================= */

function evidenceAuth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Missing authentication token'
    });
  }

  try {
    const user = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (!['doctor', 'admin'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    req.user = user;
    next();

  } catch (_) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
}


/* =========================================================
   Sync Evidence To Separate Evidence Vault
========================================================= */

async function syncEvidenceToVault({
  user,
  incident,
  out,
  screenshot,
  recording,
  replay,
  timeline,
  pageSnapshot
}) {
  const vaultUrl = process.env.EVIDENCE_VAULT_URL;
  const vaultKey = process.env.EVIDENCE_VAULT_API_KEY;

  if (!vaultUrl) {
    throw new Error(
      'EVIDENCE_VAULT_URL is not configured'
    );
  }

  if (!vaultKey) {
    throw new Error(
      'EVIDENCE_VAULT_API_KEY is not configured'
    );
  }

  const url =
    `${vaultUrl.replace(/\/$/, '')}/api/ingest`;

  console.log(
    `Sending evidence to Vault: ${out.incidentCode}`
  );

  const response = await fetch(url, {
    method: 'POST',

    headers: {
      'Content-Type': 'application/json',
      'x-evidence-key': vaultKey
    },

    body: JSON.stringify({
      user,

      incident: {
        ...incident,
        incidentCode: out.incidentCode
      },

      screenshot,
      recording,
      replay,
      timeline,
      pageSnapshot
    })
  });

  let data = {};

  try {
    data = await response.json();
  } catch (_) {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      data.message ||
      `Evidence Vault returned HTTP ${response.status}`
    );
  }

  console.log(
    `Evidence synchronized to Vault: ${out.incidentCode}`
  );

  return data;
}


/* =========================================================
   Evidence Routes
========================================================= */

function createEvidenceRoutes(io) {
  const router = express.Router();

  router.use(evidenceAuth);


  /* =======================================================
     Status
  ======================================================= */

  router.get('/status', (req, res) => {
    res.json({
      success: true,
      user: req.user.fullName,
      role: req.user.role,
      capture: 'ready'
    });
  });


  /* =======================================================
     Capture
  ======================================================= */

  router.post('/capture', async (req, res) => {
    try {
      const {
        incident,
        screenshot,
        recording,
        replay,
        timeline,
        pageSnapshot
      } = req.body || {};


      console.log(
        'Evidence capture request received:',
        {
          riskLevel: incident?.riskLevel,
          action:
            incident?.actionType ||
            incident?.actionLabel ||
            'unknown'
        }
      );


      /* ---------------------------------------------------
         Validate
      --------------------------------------------------- */

      if (
        !incident ||
        !['High', 'Critical'].includes(
          incident.riskLevel
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Only High/Critical incidents can be stored.'
        });
      }


      /* ---------------------------------------------------
         Save locally first
      --------------------------------------------------- */

      const out = await saveEvidence({
        user: req.user,
        incident,
        screenshot,
        recording,
        replay,
        timeline,
        pageSnapshot
      });


      console.log(
        'Local evidence saved:',
        {
          incidentCode: out.incidentCode,
          evidenceStatus: out.evidenceStatus,
          hasScreenshot: out.hasScreenshot,
          hasReplay: out.hasReplay
        }
      );


      /* ---------------------------------------------------
         Check local evidence
      --------------------------------------------------- */

      if (
        out.evidenceStatus !== 'Complete' ||
        !out.hasScreenshot ||
        !out.hasReplay
      ) {
        console.error(
          'Evidence capture incomplete:',
          out.incidentCode
        );

        return res.status(422).json({
          success: false,

          message:
            'Evidence capture incomplete. Screenshot and session recording are required.',

          ...out
        });
      }


      /* ---------------------------------------------------
         Sync to external Vault

         IMPORTANT:
         Vault failure must NOT stop Admin notification.
      --------------------------------------------------- */

      let vaultSynced = false;
      let vaultError = null;
      let vaultResult = null;

      try {
        vaultResult =
          await syncEvidenceToVault({
            user: req.user,
            incident,
            out,
            screenshot,
            recording,
            replay,
            timeline,
            pageSnapshot
          });

        vaultSynced = true;

      } catch (vaultSyncError) {
        vaultError =
          vaultSyncError.message;

        console.error(
          'Evidence Vault synchronization failed:',
          vaultError
        );

        /*
          DO NOT throw here.

          We still need to notify Admin even
          if the remote Vault is temporarily unavailable.
        */
      }


      /* ---------------------------------------------------
         Always notify Admin after local evidence succeeded
      --------------------------------------------------- */

      if (io) {
        const now =
          new Date().toISOString();

        const event = {
          ...incident,

          incidentCode:
            out.incidentCode,

          incidentId:
            incident.incidentId || null,

          userId:
            req.user.id,

          username:
            req.user.username,

          fullName:
            req.user.fullName,

          doctor:
            req.user.role === 'doctor'
              ? req.user.fullName
              : undefined,

          doctorId:
            req.user.doctorId || null,

          department:
            req.user.department || null,

          role:
            req.user.role,

          risk:
            incident.riskLevel,

          riskLevel:
            incident.riskLevel,

          evidenceReady: true,

          evidenceFiles:
            out.files,

          vaultSynced,

          vaultError,

          time: now,
          timestamp: now
        };


        console.log(
          `Sending Admin critical alert: ${out.incidentCode}`
        );


        io.emit(
          'admin:critical-alert',
          event
        );


        io.emit(
          'evidence:stored',
          event
        );


        console.log(
          `Admin critical alert emitted: ${out.incidentCode}`
        );
      } else {
        console.error(
          'Socket.IO instance unavailable in evidenceRoutes'
        );
      }


      /* ---------------------------------------------------
         Response
      --------------------------------------------------- */

      return res.json({
        success: true,

        ...out,

        vaultSynced,

        vaultError,

        vaultIncident:
          vaultResult?.incidentCode ||
          out.incidentCode
      });


    } catch (error) {
      console.error(
        'Evidence capture error:',
        error
      );

      return res.status(500).json({
        success: false,

        message:
          'Evidence capture failed: ' +
          error.message
      });
    }
  });


  return router;
}


module.exports = createEvidenceRoutes;
