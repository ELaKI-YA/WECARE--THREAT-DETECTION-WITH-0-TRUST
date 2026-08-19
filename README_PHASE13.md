# WeCare Medical Center MVP

## Included changes
- Removed doctor profile image and phase labels from the interface.
- Removed Forensic Cases from the administrator navigation.
- Added 6,000 sample patients and 6,000 scan-report entries in the doctor workspace.
- Added select-all and export-all controls. A full-data export is blocked and immediately triggers account restriction, administrator alert, incident creation, and forced login return.
- Fixed doctor Security Inbox token storage, message polling, Socket.IO popup delivery, and India Standard Time rendering.
- Fixed ML simulation timestamps by returning ISO-8601 UTC values and rendering them in Asia/Kolkata.
- Default server port is 3000.

## Run
```powershell
npm install
node server.js
```
Open http://localhost:3000
