# Phase 15 Focused Admin + Evidence Capture Update

Changes in this build:
- Existing Admin dashboard design retained.
- Removed Admin navigation entries: Audit Logs, Automatic Mitigation, Verification Queue, ML Prediction.
- Removed the LIVE banner and common explanation/helper text from Admin UI.
- Added High/Critical evidence capture for Doctor/Admin sessions.
- Evidence files: screenshot image, recording.webm when browser recording is supported, replay.json fallback, timeline.json, incident.json, manifest.json.
- Added separate read-only Evidence Vault service on http://127.0.0.1:8080.
- Demo Evidence Officer credentials: officer / officer123 (change for any non-demo use).
- Admin Critical Alert is emitted only after evidence is saved.

Evidence capture is limited to the WeCare application viewport/session; it does not capture the Windows desktop or other applications.
