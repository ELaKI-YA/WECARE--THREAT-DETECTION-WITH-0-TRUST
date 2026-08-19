# WeCare Phase 12 MVP

See `PHASE12_README.md` for the final MVP guide.

# Health Threat Detection

Secure hospital authentication, activity monitoring, and risk detection system with separate **Doctor** and **Admin** interfaces. Built as a cybersecurity hackathon project.

The project is built in phases:
- **Phase 1** — Hardened authentication, role-based access control, and real-time login monitoring over a local network.
- **Phase 2** — Doctor activity monitoring, rule-based risk scoring, real-time admin alerts, and attack simulation. (current)

---

## Project Overview

The system is designed to run on a single **Admin laptop** that hosts the Node.js server, while a **Doctor laptop** connects to the Admin laptop's local IP address over the same Wi-Fi/LAN. The Admin dashboard receives real-time notifications whenever a doctor logs in, providing live visibility into clinician access.

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express.js |
| Database | SQLite |
| Authentication | bcryptjs + jsonwebtoken (JWT) |
| Real-time | Socket.IO |
| Frontend | HTML, CSS, Vanilla JavaScript |

---

## Phase 1 Features

1. Admin authentication
2. Doctor authentication
3. JWT-based authorization (8 hour expiry)
4. SQLite database (auto-created)
5. Password hashing with bcryptjs
6. Role-based access control (`admin` / `doctor`)
7. Admin Dashboard
8. Doctor Dashboard
9. Socket.IO connection
10. Real-time Doctor login notification on the Admin Dashboard
11. Logout functionality
12. Protected API route (`GET /api/auth/me`)

---

## Phase 2 Features

1. Doctor activity monitoring — every simulated hospital action is logged
2. Rule-based risk scoring engine (`services/riskEngine.js`) with explainable, human-readable reasons
3. Session risk score, risk level, and colored progress bar on the doctor dashboard
4. Real-time admin alerts via Socket.IO (`activity:new`, `risk:updated`, `security:high-risk-alert`, `security:critical-alert`)
5. Security incidents automatically created when a doctor reaches Critical risk (score >= 80)
6. Admin dashboard: live activity feed, doctor risk monitor, high-risk alert panel, and security incident table
7. Activity filters (all / suspicious / critical)
8. Attack simulation button (unknown device login -> cross-department access -> export 100 records)
9. Demo reset button (clears the current doctor's activity + incidents)
10. Backend-validated action types — the frontend never controls risk points

---

## Folder Structure

```
health-threat-detection/
├── package.json
├── server.js
├── .env.example
├── .gitignore
├── README.md
├── database/
│   ├── database.js
│   └── seed.js
├── middleware/
│   └── authMiddleware.js
├── routes/
│   ├── authRoutes.js
│   ├── activityRoutes.js
│   └── adminRoutes.js
├── services/
│   ├── socketService.js
│   ├── riskEngine.js
│   └── activityService.js
└── public/
    ├── index.html
    ├── admin-login.html
    ├── admin-dashboard.html
    ├── doctor-login.html
    ├── doctor-dashboard.html
    ├── css/
    │   ├── common.css
    │   ├── admin.css
    │   └── doctor.css
    └── js/
        ├── admin-login.js
        ├── admin-dashboard.js
        ├── doctor-login.js
        └── doctor-dashboard.js
```

---

## Installation Instructions

1. Open a terminal in the project folder (e.g. `D:\health-threat-detection`).

2. Install dependencies:

   ```
   npm install
   ```

3. Copy the example environment file:

   ```
   copy .env.example .env
   ```

   On macOS/Linux:

   ```
   cp .env.example .env
   ```

4. Open `.env` and set a secure `JWT_SECRET` (any long random string).

---

## Environment Configuration

The `.env` file contains two variables:

```
PORT=80
JWT_SECRET=replace-with-a-secure-secret
```

- **PORT** — the port the server listens on (default `3000`).
- **JWT_SECRET** — the secret used to sign JWT tokens. Replace the placeholder with a long, random, private string. **Never commit your real secret to git.**

The `.gitignore` file already excludes `.env` and the SQLite database file.

---

## Database Seed Instructions

Seed the database with the default admin and doctor users:

```
npm run seed
```

This script:
- Creates the SQLite database and tables if they do not exist.
- Hashes the default passwords with bcryptjs.
- Inserts the admin and doctor users.
- **Skips users that already exist**, so it is safe to run repeatedly.

You should see output similar to:

```
Database connected at ...\database\health.db
Seeded user 'admin' (admin).
Seeded user 'doctor' (doctor).
Seeding complete.
```

---

## Running Instructions

1. Make sure you have completed installation and seeding.

2. Start the server:

   ```
   npm start
   ```

3. You should see:

   ```
   Database connected
   Socket.IO initialized
   Server running on http://0.0.0.0:80
   ```

4. Open a browser and navigate to one of the URLs below.

### Admin URL (on the Admin laptop)

```
http://localhost/admin-login.html
```

### Doctor URL (on the Admin laptop)

```
http://localhost/doctor-login.html
```

### Doctor URL (from another laptop on the same LAN)

```
http://ADMIN-LAPTOP-IP:3000/doctor-login.html
```

Replace `ADMIN-LAPTOP-IP` with the Admin laptop's local IP address (see below).

---

## Demo Credentials

| Role  | Username | Password    | Full Name              | Doctor ID | Department |
|-------|----------|-------------|------------------------|-----------|------------|
| Admin | `admin`  | `admin123`  | Security Administrator | —         | —          |
| Doctor| `doctor` | `doctor123` | Dr. Alex Morgan        | DOC001    | Cardiology |

These credentials are for demo/hackathon use only.

---

## Phase 2 — Risk Scoring Engine

The risk engine (`services/riskEngine.js`) assigns fixed points per action type. The backend is the sole source of truth — the frontend never sends risk points.

| Action | Points | Reason |
|--------|--------|--------|
| View Patient Record | +2 | Viewed a normal patient record |
| View Emergency Record | +5 | Viewed an emergency record |
| Access own department | +3 | Accessed their own department |
| Access another department | +20 | Accessed a different department |
| Export 10 records | +15 | Exported 10 patient records |
| Export 100 records | +45 | Exported 100 patient records |
| Download confidential report | +25 | Downloaded a confidential report |
| Unknown device login | +35 | Logged in from an unknown device |
| Rapid record access | +30 | Rapid sequential record access detected |

The session score is capped at 100.

| Score range | Risk level | Status label | Color |
|-------------|-----------|--------------|-------|
| 0–29 | Low | Normal | green |
| 30–59 | Medium | Suspicious | yellow |
| 60–79 | High | Critical | orange |
| 80–100 | Critical | Critical | red |

Every score change includes a human-readable explanation, e.g.:

- "Risk increased by 45 because the doctor exported 100 patient records."
- "Risk increased by 20 because the doctor accessed a different department."

---

## Phase 2 API Routes

All routes require a valid JWT in the `Authorization: Bearer <token>` header.

### Doctor routes (`/api/activity`) — doctor role only

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/activity/log` | Log one activity. Body: `{ actionType }` |
| GET | `/api/activity/my-activity` | Fetch the doctor's recent activity (last 50) |
| GET | `/api/activity/my-risk` | Fetch the doctor's current session risk score |
| POST | `/api/activity/simulate-attack` | Run the 3-step attack simulation |
| POST | `/api/activity/reset-demo` | Clear the doctor's activity logs + incidents |

### Admin routes (`/api/admin`) — admin role only

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/activities` | Fetch all activity logs (last 200) |
| GET | `/api/admin/incidents` | Fetch all security incidents (last 100) |

---

## Phase 2 — Real-Time Socket.IO Events

| Event | Emitted when | Recipients |
|-------|-------------|------------|
| `activity:new` | Any activity is logged | All clients |
| `risk:updated` | A doctor's score changes | All clients |
| `security:high-risk-alert` | Score reaches 60–79 | All clients |
| `security:critical-alert` | Score reaches 80+ (and an incident is created) | All clients |

Admin dashboard payloads include: doctor name, doctor ID, activity, risk points, total risk score, severity, reason, timestamp, and IP address.

---

## Phase 2 Demo Flow

1. Open the admin dashboard on the Admin laptop (`http://localhost/admin-dashboard.html`) and log in as admin.
2. Open the doctor dashboard on the Doctor laptop (`http://ADMIN-LAPTOP-IP:3000/doctor-dashboard.html`) and log in as doctor.
3. On the doctor dashboard, click individual action buttons to watch the risk meter rise and the admin live activity feed update in real time.
4. Click **Run Attack Simulation**. The doctor dashboard will sequentially simulate unknown device login (+35), cross-department access (+20), and export 100 records (+45), reaching a Critical score of 100. The admin dashboard will show:
   - A high-risk alert at 55 (after the first two actions)
   - A critical alert and a new security incident row at 100
5. Click **Reset Demo** on the doctor dashboard to clear the activity and risk score, then try again.

---

## Phase 2 Testing

Phase 2 has a dedicated test suite:

```
npm test
```

This runs both the Phase 1 integration tests and the Phase 2 tests covering:

- Normal activity logging
- Invalid action type rejection
- Protected route rejection without JWT
- Doctor unable to access admin routes (403)
- Risk score calculation
- High-risk alert threshold (score >= 60)
- Critical incident creation (score >= 80)
- Attack simulation reaching critical
- Demo reset clearing data
- Frontend-supplied risk points being ignored by the backend

---

## Two-Laptop LAN Setup

This project is designed to run across two laptops on the same local network.

### Step 1 — Find the Admin laptop's IP address

On the **Admin laptop** (Windows 11):

1. Press `Win + R`, type `cmd`, and press Enter.
2. Run:

   ```
   ipconfig
   ```

3. Look for the **IPv4 Address** under your active network adapter (Wi-Fi or Ethernet). It usually looks like `192.168.x.x` or `10.0.x.x`.

   Example:

   ```
   Wireless LAN adapter Wi-Fi:
      IPv4 Address. . . . . . . . . . . : 192.168.1.42
   ```

   In this example, the Admin laptop IP is `192.168.1.42`.

### Step 2 — Connect both laptops to the same network

- Both laptops must use the **same Wi-Fi network** or a **mobile hotspot** hosted by one of the laptops.
- Confirm the Doctor laptop can ping the Admin laptop (optional):

   ```
   ping 192.168.1.42
   ```

### Step 3 — Start the server on the Admin laptop

On the Admin laptop, in the project folder:

```
npm install
npm run seed
npm start
```

The server listens on `0.0.0.0`, meaning it accepts connections from other devices on the LAN — not just localhost.

### Step 4 — Open the Admin dashboard

On the Admin laptop, open:

```
http://localhost/admin-login.html
```

Log in with the admin credentials. Keep this dashboard open to watch live doctor logins.

### Step 5 — Open the Doctor portal from the Doctor laptop

On the Doctor laptop, open a browser and navigate to:

```
http://ADMIN-LAPTOP-IP:3000/doctor-login.html
```

For example:

```
http://192.168.1.42:3000/doctor-login.html
```

Log in with the doctor credentials. The Admin dashboard should display the doctor's login in real time in the **Live Doctor Login Activity** panel.

---

## Windows Firewall Instructions

If the Doctor laptop cannot reach the Admin laptop, Windows Firewall may be blocking port 3000.

### Option A — Allow port 3000 via Windows Defender Firewall

1. On the Admin laptop, press `Win + R`, type `wf.msc`, and press Enter.
2. In the left pane, click **Inbound Rules**.
3. In the right pane, click **New Rule...**.
4. Select **Port** and click Next.
5. Select **TCP** and **Specific local ports**, enter `3000`, and click Next.
6. Select **Allow the connection** and click Next.
7. Check the network profiles you use (at least **Private**), click Next.
8. Name the rule (e.g. `Health Threat Detection - Port 3000`) and click Finish.

### Option B — Temporarily allow the Node app

When you first run `npm start`, Windows may show a security alert. Click **Allow access** for private networks.

### Option C — Quick test

To temporarily disable the firewall for testing only (not recommended long-term):

```
netsh advfirewall set allprofiles state off
```

Re-enable it afterwards:

```
netsh advfirewall set allprofiles state on
```

---

## Testing Instructions

### 1. Seed and start

```
npm install
npm run seed
npm start
```

### 2. Admin login flow

- Open `http://localhost/admin-login.html`.
- Log in with `admin` / `admin123`.
- Confirm redirect to `admin-dashboard.html`.
- Confirm the admin name, authentication status, socket status, server status, and current time all display correctly.

### 3. Doctor login flow

- Open `http://localhost/doctor-login.html` (or from the Doctor laptop via the Admin IP).
- Log in with `doctor` / `doctor123`.
- Confirm redirect to `doctor-dashboard.html`.
- Confirm the welcome message, doctor ID, department, and socket status display correctly.

### 4. Real-time notification

- Keep the Admin dashboard open.
- Log in as a doctor (optionally from the Doctor laptop).
- A new **Authenticated** activity card should appear at the top of the **Live Doctor Login Activity** panel without a page refresh.

### 5. Role-based access control

- Try logging in as `admin` from the **Doctor Login** page. You should see **Access denied for this role**.
- Try logging in as `doctor` from the **Admin Login** page. You should see the same message.

### 6. Protected route

- Without a token, call the protected endpoint:

  ```
  curl http://localhost/api/auth/me
  ```

  Expected: `401` with `{ "success": false, "message": "Missing authentication token" }`.

- With a valid token:

  ```
  curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost/api/auth/me
  ```

  Expected: `200` with the authenticated user's safe information.

### 7. Logout

- Click **Logout** on either dashboard.
- Confirm redirect to the correct login page and that going back does not restore the session.

---

## Common Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| `EADDRINUSE: address already in use :::3000` | Another process is using port 3000 | Stop the other process or change `PORT` in `.env` |
| Doctor laptop cannot load the page | Firewall blocking port 3000, or different network | Follow the **Windows Firewall** section; confirm both laptops are on the same Wi-Fi/hotspot |
| `Cannot find module 'sqlite3'` | Dependencies not installed | Run `npm install` |
| Login returns `Invalid username or password` | Wrong credentials, or database not seeded | Run `npm run seed` and use the demo credentials |
| `jwt secret is required` / token signing fails | `JWT_SECRET` missing in `.env` | Copy `.env.example` to `.env` and set a secure secret |
| Doctor login event not appearing on Admin dashboard | Admin dashboard not open, or socket not connected | Keep the Admin dashboard open and check the Socket.IO status pill shows **Connected** |
| `access denied for this role` | Logging in from the wrong portal | Use the Admin portal for admins and the Doctor portal for doctors |
| Database locked / `SQLITE_BUSY` | Another process holds the DB file | Stop other Node instances and retry |
| Page loads but assets 404 | Server not running from the project root | Run `npm start` from the project folder |

---

## Security Notes

- Passwords are never stored in plain text. They are hashed with bcryptjs.
- `password_hash` is never returned by any API response.
- The JWT secret is read from `process.env.JWT_SECRET` and is never hard-coded in source files.
- All SQL queries use prepared statements with bound parameters to prevent SQL injection.
- The protected route `GET /api/auth/me` requires a valid Bearer token.
- Frontend pages redirect to the login page if no token is present or the role does not match.

---

## Phase Scope Boundaries

**Phase 1** covers authentication, JWT authorization, SQLite, role-based access, dashboards, and real-time login monitoring.

**Phase 2** covers activity monitoring, risk scoring, real-time alerts, attack simulation, security incidents, and demo reset.

Future phases may add AI-driven threat detection, patient records management, prescriptions, data export features, and automated attack simulations.
