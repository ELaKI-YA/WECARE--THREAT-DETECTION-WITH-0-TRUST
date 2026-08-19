# WeCare Medical Center — Doctor Dashboard Update

This build changes the Doctor Dashboard only.

## Updated files
- `public/doctor-dashboard.html`
- `public/css/doctor.css`
- `public/js/doctor-dashboard.js`

## Preserved functionality
- JWT doctor authentication
- Activity logging and risk scoring
- Attack simulation and demo reset
- Socket.IO connection status
- Logout flow
- Mobile verification link
- Existing backend API endpoints

## Added to the dashboard
- WeCare Medical Center identity
- Minimal black, white and gray layout
- Risk colors only for Low, Medium, High and Critical
- Doctor profile summary
- Current risk overview
- Mobile verification status
- Active sessions table using `/api/sessions/my-sessions`
- Pending verification count using `/api/sessions/pending-verifications`
- Responsive layout

## Run
```bash
npm install
npm run seed
npm start
```

Open `http://localhost:3000/doctor-login.html`.
