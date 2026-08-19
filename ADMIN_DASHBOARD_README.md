# WeCare Professional Admin Dashboard — Phase 1

Run:

```bash
npm install
node server.js
```

Open `http://localhost:3000/admin-login.html` or the route already used by your project.

## Added in this build
- Full black and royal-blue administrator workspace
- Functional Dashboard analytics
- Functional Doctors module with search, status filtering, Add, Edit, Delete, and CSV export
- Functional Patients module with search, filtering, Add, Edit, Delete, rare blood-group highlighting, and CSV export
- Threat monitoring with attack-profile radar chart
- ML prediction and automatic mitigation views
- Live 60-second verification queue

Doctor and patient demonstration edits are stored in the browser with `localStorage`, keeping the existing Express, SQLite, JWT, and Socket.IO backend unchanged. They can later be connected to the existing API routes.
