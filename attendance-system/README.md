# AttendCloud — Cloud-Based Attendance Management System

A full-stack attendance management system for educational institutions, with
role-based dashboards for **Admins**, **Teachers**, and **Students**, MongoDB
cloud storage, PDF/Excel report generation, and automated low-attendance
email alerts.

```
Backend:  Node.js + Express.js + MongoDB (Mongoose) + JWT Auth
Frontend: HTML5 + CSS3 + Bootstrap 5 + Vanilla JavaScript
Reports:  PDFKit (PDF) + ExcelJS (Excel)
Email:    Nodemailer (SMTP)
```

---

## 1. Features

| Role        | Capabilities |
|-------------|--------------|
| **Admin**   | Manage all users (create/edit/deactivate/delete), manage departments, manage subjects and teacher assignments, view system-wide stats |
| **Teacher** | Create classes (sections) for a subject, build class rosters, mark/edit daily attendance, view per-class attendance reports, export Excel reports |
| **Student** | View overall and per-subject attendance percentage, view full attendance history with date filters, download personal PDF/Excel reports |
| **System**  | Sends an automated email when a student's attendance drops below a configurable threshold (default 75%), throttled to one email per 24h per student |

---

## 2. Project Architecture

The system follows a classic **3-tier architecture**: a static frontend
(HTML/CSS/JS + Bootstrap) talks to a stateless REST API (Node/Express),
which persists data in MongoDB (Atlas, cloud-hosted). Authentication is
JWT-based and stateless, so the API can scale horizontally without shared
session storage.

See the architecture diagram and ER diagram rendered above in this
conversation, and the Mermaid source in [`docs/ER-DIAGRAM.md`](docs/ER-DIAGRAM.md).

**Request flow example — marking attendance:**
1. Teacher's browser sends `POST /api/attendance/mark` with a JWT in the
   `Authorization` header.
2. `protect` middleware verifies the JWT and loads the user; `authorize('teacher','admin')`
   checks the role.
3. The controller upserts an `Attendance` document (one per class per date).
4. The response is sent immediately; **after** responding, the server
   asynchronously recomputes each affected student's running percentage and
   fires a low-attendance email if needed (fire-and-forget, so the teacher
   isn't kept waiting on SMTP).

---

## 3. Database Schema

MongoDB collections (see `backend/models/`):

- **User** — `name, email, password (hashed), role[admin|teacher|student], rollNumber, department, subjects[], isActive, lowAttendanceAlertSentAt`
- **Department** — `name, code, description, headOfDepartment`
- **Subject** — `name, code, department, semester, teacher, credits`
- **ClassSession** — `name, subject, teacher, department, students[], schedule, isActive` (a teacher-created class/section)
- **Attendance** — `classSession, subject, teacher, date, records[{student, status, remarks}]` (one document per class per date; unique index on `classSession + date`)

Full field-level detail and relationships are in [`docs/ER-DIAGRAM.md`](docs/ER-DIAGRAM.md).

---

## 4. Folder Structure

```
attendance-system/
├── backend/
│   ├── config/
│   │   ├── db.js                 # MongoDB connection
│   │   └── email.js              # Nodemailer transporter
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── departmentController.js
│   │   ├── subjectController.js
│   │   ├── classController.js
│   │   ├── attendanceController.js
│   │   ├── reportController.js
│   │   └── dashboardController.js
│   ├── middleware/
│   │   ├── auth.js               # JWT protect + role authorize
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Department.js
│   │   ├── Subject.js
│   │   ├── ClassSession.js
│   │   └── Attendance.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── departmentRoutes.js
│   │   ├── subjectRoutes.js
│   │   ├── classRoutes.js
│   │   ├── attendanceRoutes.js
│   │   ├── reportRoutes.js
│   │   └── dashboardRoutes.js
│   ├── utils/
│   │   ├── asyncHandler.js
│   │   ├── generateToken.js
│   │   ├── attendanceCalculator.js
│   │   ├── lowAttendanceNotifier.js
│   │   └── seed.js               # demo data seed script
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── css/style.css              # custom theme (over Bootstrap 5)
│   ├── js/
│   │   ├── config.js              # API base URL
│   │   ├── api.js                 # fetch wrapper
│   │   ├── auth.js                # session + route guards
│   │   └── ui.js                  # sidebar, toasts, formatting
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── admin-dashboard.html
│   ├── admin-users.html
│   ├── admin-departments.html
│   ├── admin-subjects.html
│   ├── teacher-dashboard.html
│   ├── teacher-classes.html
│   ├── teacher-attendance.html
│   ├── teacher-reports.html
│   ├── student-dashboard.html
│   ├── student-attendance.html
│   └── student-reports.html
└── docs/
    └── ER-DIAGRAM.md
```

---

## 5. API Endpoints

Base URL: `http://localhost:5000/api` (local) or your deployed backend URL.
All endpoints except `/auth/register` and `/auth/login` require header
`Authorization: Bearer <token>`.

### Auth
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Self-register (students) |
| POST | `/auth/login` | Public | Login, returns JWT |
| GET | `/auth/me` | Private | Get own profile |
| PUT | `/auth/change-password` | Private | Change own password |

### Users (Admin)
| Method | Endpoint | Access |
|---|---|---|
| POST | `/users` | Admin |
| GET | `/users?role=&department=&search=` | Admin |
| GET | `/users/:id` | Admin |
| PUT | `/users/:id` | Admin |
| DELETE | `/users/:id` | Admin |
| PUT | `/users/:id/reset-password` | Admin |

### Departments
| Method | Endpoint | Access |
|---|---|---|
| GET | `/departments` | Any authenticated |
| GET | `/departments/:id` | Any authenticated |
| POST | `/departments` | Admin |
| PUT | `/departments/:id` | Admin |
| DELETE | `/departments/:id` | Admin |

### Subjects
| Method | Endpoint | Access |
|---|---|---|
| GET | `/subjects?department=&teacher=` | Any authenticated |
| GET | `/subjects/:id` | Any authenticated |
| POST | `/subjects` | Admin |
| PUT | `/subjects/:id` | Admin |
| DELETE | `/subjects/:id` | Admin |

### Classes
| Method | Endpoint | Access |
|---|---|---|
| POST | `/classes` | Teacher, Admin |
| GET | `/classes` | Any (filtered by role: teacher sees own, student sees enrolled) |
| GET | `/classes/:id` | Any authenticated |
| PUT | `/classes/:id` | Teacher (owner), Admin |
| POST | `/classes/:id/students` | Teacher (owner), Admin — add students to roster |
| DELETE | `/classes/:id` | Teacher (owner), Admin |

### Attendance
| Method | Endpoint | Access |
|---|---|---|
| POST | `/attendance/mark` | Teacher, Admin — body: `{classSessionId, date, records:[{student,status,remarks}]}` |
| GET | `/attendance/class/:classId?from=&to=` | Teacher, Admin |
| GET | `/attendance/class/:classId/date/:date` | Teacher, Admin — fetch existing record or fresh roster |
| GET | `/attendance/student/:studentId?subjectId=&from=&to=` | Self, Teacher, Admin |
| GET | `/attendance/student/:studentId/by-subject` | Self, Teacher, Admin |

### Reports
| Method | Endpoint | Access |
|---|---|---|
| GET | `/reports/student/:studentId/pdf` | Self, Teacher, Admin |
| GET | `/reports/student/:studentId/excel` | Self, Teacher, Admin |
| GET | `/reports/class/:classId/excel` | Teacher, Admin |

### Dashboard
| Method | Endpoint | Access |
|---|---|---|
| GET | `/dashboard/admin` | Admin |
| GET | `/dashboard/teacher` | Teacher |

---

## 6. Local Setup

### Prerequisites
- Node.js ≥ 18
- A MongoDB connection string (free tier on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) works great)
- An SMTP account for email alerts (e.g. a Gmail account with an **App Password**)

### Backend
```bash
cd backend
cp .env.example .env
# edit .env: set MONGO_URI, JWT_SECRET, SMTP_* values
npm install
npm run seed     # optional: creates demo admin/teacher/student accounts
npm run dev      # starts on http://localhost:5000 (nodemon)
```

### Frontend
The frontend is static — no build step. Either:
- Open `frontend/login.html` directly in a browser, or
- Serve it with any static server, e.g. `npx serve frontend` or the VS Code "Live Server" extension.

Edit `frontend/js/config.js` if your backend isn't on `http://localhost:5000`.

### Demo accounts (after `npm run seed`)
| Role | Email | Password |
|---|---|---|
| Admin | admin@attendance.com | Admin@123 |
| Teacher | teacher@attendance.com | Teacher@123 |
| Student | student1@attendance.com | Student@123 |

---

## 7. Deployment

### Option A — Render (recommended, simplest)

**Backend (Web Service):**
1. Push this repo to GitHub.
2. On Render: **New → Web Service** → connect the repo, root directory `backend`.
3. Build command: `npm install`. Start command: `npm start`.
4. Add environment variables from `.env.example` (use your real MongoDB Atlas URI, JWT secret, SMTP credentials). Set `NODE_ENV=production`.
5. Deploy. Note the public URL, e.g. `https://attendance-api.onrender.com`.

**Frontend (Static Site):**
1. On Render: **New → Static Site** → connect the repo, root directory `frontend`.
2. Build command: leave blank (no build step). Publish directory: `.`
3. Before deploying, edit `frontend/js/config.js` to point `API_BASE_URL` at your backend's Render URL + `/api`.
4. Deploy. Render gives you a public URL for the static site.
5. Back on the backend service, set `CLIENT_URL` to that static site URL so CORS allows it.

**MongoDB:** Use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (free M0 tier). Create a cluster, a database user, and whitelist `0.0.0.0/0` (or Render's IPs) under Network Access. Copy the connection string into `MONGO_URI`.

### Option B — AWS

- **Backend:** Deploy to **Elastic Beanstalk** (Node.js platform) or an **EC2** instance running `pm2 start server.js`. Put it behind an **Application Load Balancer** with an ACM TLS certificate for HTTPS.
- **Frontend:** Upload the `frontend/` folder to an **S3** bucket configured for static website hosting, and put **CloudFront** in front of it for HTTPS + caching.
- **Database:** Use **MongoDB Atlas** (cloud-hosted, works identically regardless of where your compute lives) or **Amazon DocumentDB** (MongoDB-compatible) if you need to stay entirely within AWS.
- **Secrets:** Store `.env` values in **AWS Secrets Manager** or **Systems Manager Parameter Store** rather than committing them.

### Option C — Single-service deployment (backend serves frontend)

`server.js` already includes a production branch that serves the `frontend/`
folder as static files and falls back to `index.html` for non-API routes.
This lets you deploy **one** Render Web Service (or one EC2 instance) for
both tiers — just make sure `frontend/js/config.js` points `API_BASE_URL` at
the same origin (e.g. `/api` as a relative path) when using this mode.

---

## 8. Security Notes

- Passwords are hashed with bcrypt (10 salt rounds) and never returned in API responses.
- JWTs expire after 7 days by default (`JWT_EXPIRES_IN`); the frontend force-logs-out on a 401 response.
- All write endpoints are protected by role-based middleware (`protect` + `authorize`).
- Teachers can only mark/edit/delete classes and attendance they own; students can only view their own records.
- Set a long, random `JWT_SECRET` in production — never reuse the example value.

---

## 9. Possible Extensions

- Push notifications (in addition to email) via web push or a mobile app
- Biometric/QR-code based attendance check-in
- Bulk CSV import for users and class rosters
- Attendance analytics dashboard with trend charts over a semester
- Multi-institution / tenant support
