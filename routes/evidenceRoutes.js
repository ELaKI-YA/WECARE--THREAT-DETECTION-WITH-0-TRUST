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
   Send Evidence To Separate Evidence Vault
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
  const vaultUrl =
    process.env.EVIDENCE_VAULT_URL;

  const vaultKey =
    process.env.EVIDENCE_VAULT_API_KEY;


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


  const response = await fetch(
    url,
    {
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
    }
  );


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


  /* ---------------------------------------------------------
     Status
  --------------------------------------------------------- */

  router.get(
    '/status',
    (req, res) => {
      res.json({
        success: true,
        user: req.user.fullName,
        role: req.user.role,
        capture: 'ready'
      });
    }
  );


  /* ---------------------------------------------------------
     Capture Evidence
  --------------------------------------------------------- */

  router.post(
    '/capture',
    async (req, res) => {

      try {

        const {
          incident,
          screenshot,
          recording,
          replay,
          timeline,
          pageSnapshot
        } = req.body || {};


        /* ---------------------------------------------------
           Only High / Critical incidents
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
           Save Evidence In Main WeCare
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


        /* ---------------------------------------------------
           Verify Evidence Was Captured
        --------------------------------------------------- */

        if (
          out.evidenceStatus !== 'Complete' ||
          !out.hasScreenshot ||
          !out.hasReplay
        ) {
          return res.status(422).json({
            success: false,

            message:
              'Evidence capture incomplete. Screenshot and session recording are required.',

            ...out
          });
        }


        /* ---------------------------------------------------
           Synchronize Evidence To Public Evidence Vault
        --------------------------------------------------- */

        const vaultResult =
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


        /* ---------------------------------------------------
           Alert Admin ONLY after:
           
           1. Local evidence saved
           2. Screenshot stored
           3. Replay stored
           4. Evidence copied to Vault
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

            vaultSynced: true,

            time: now,

            timestamp: now
          };


          io.emit(
            'admin:critical-alert',
            event
          );


          io.emit(
            'evidence:stored',
            event
          );
        }


        /* ---------------------------------------------------
           Success Response
        --------------------------------------------------- */

        return res.json({

          success: true,

          ...out,

          vaultSynced: true,

          vaultIncident:
            vaultResult.incidentCode ||
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
    }
  );


  return router;
}


module.exports =
  createEvidenceRoutes;
