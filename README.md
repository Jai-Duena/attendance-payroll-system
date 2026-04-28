# Attendance & Payroll Management System

A full-stack web-based HR management system for employee attendance tracking, payroll processing, and biometric device integration. Built for small-to-medium businesses in the Philippines with support for government-mandated contributions (SSS, PhilHealth, PAG-IBIG, BIR).

---

## Tech Stack

### Backend
- **PHP** — REST API with PDO and prepared statements
- **MySQL** — Relational database with 40+ tables
- **Apache (XAMPP)** — Local development server

### Frontend
- **React 18 + TypeScript** — Component-based UI
- **Vite** — Build tool and dev server
- **Tailwind CSS 4** — Utility-first styling
- **Radix UI / shadcn-ui** — Accessible headless components
- **React Router 7** — Client-side routing
- **Recharts** — Data visualization

### Biometric Integration
- **Python 3 + PyQt6** — Desktop sync application
- **pyzk** — ZKTeco device communication protocol
- **Windows Task Scheduler** — Automated sync every 2 minutes

> **Device used:** ZKTeco ZK3969

---

## Features

- **Role-based dashboards** — Employee, Supervisor, and Admin views
- **Attendance tracking** — Manual entry and ZKTeco biometric device sync
- **Payroll processing** — Batch generation, approval workflow, and payslip export
- **Government reports** — SSS, PhilHealth, PAG-IBIG, BIR withholding tax, and 13th month pay
- **Leave & overtime requests** — Submit, approve, and reject workflow
- **Employee management** — Directory with departments, shifts, and profiles
- **Shift scheduling** — Flexible shift assignment per employee
- **Real-time chat** — In-app messaging between employees
- **Bulletin board** — Company announcements with date targeting
- **Holiday calendar** — Custom holidays integrated into payroll computation
- **Dark/light theme** — System-aware theme toggle

---

## Project Structure

```
attendance-payroll-system/
├── backend/                  # PHP REST API (runs on XAMPP)
│   ├── api/
│   │   ├── attendance/       # Attendance records, shift schedules, ZKTeco sync
│   │   ├── payroll/          # Payroll generation, approval, BIR reports
│   │   ├── employees/        # Employee CRUD and department management
│   │   ├── auth/             # Login, logout, password management
│   │   ├── requests/         # Leave and overtime request workflow
│   │   ├── biometric/        # ZKTeco device settings and sync triggers
│   │   ├── chat/             # In-app messaging
│   │   ├── announcements/    # Bulletin board
│   │   ├── calendar/         # Holiday management
│   │   ├── notifications/    # Push notifications and SSE
│   │   ├── settings/         # Company profile and payroll settings
│   │   └── notes/            # Employee notes
│   ├── bio-sync-app/         # Python desktop app for biometric sync
│   ├── config/               # DB, CORS, mail configuration
│   ├── sql/                  # Database migration files
│   └── sync/                 # Biometric sync scripts
│
└── frontend/                 # React + TypeScript SPA
    └── src/
        ├── app/
        │   ├── components/   # Page and UI components
        │   └── context/      # Global state (company settings, theme)
        ├── lib/
        │   └── api.ts        # API client
        └── styles/           # Global CSS and Tailwind config
```

---

## Getting Started

### Prerequisites
- [XAMPP](https://www.apachefriends.org/) (PHP 7.4+ and MySQL)
- [Node.js](https://nodejs.org/) 18+
- [Python](https://www.python.org/) 3.10+ *(for biometric sync only)*

### Backend Setup

1. Copy the `backend/` folder to your XAMPP `htdocs` directory.
2. Create a `.env` file in `backend/` based on this template:
   ```
   DB_HOST=localhost
   DB_NAME=your_database_name
   DB_USER=root
   DB_PASS=
   ```
3. Import the database by visiting `http://localhost/backend/setup.php` in your browser — it will auto-create all tables.
4. *(Optional)* Run `http://localhost/backend/seed.php` to populate test data.

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

### Biometric Sync App Setup *(optional)*

```bash
cd backend/bio-sync-app
pip install -r requirements.txt
python main.py
```

Configure the ZKTeco device IP in the app, then register the Windows Task Scheduler task via `register-sync-task.ps1`.

> **Compatible devices:** The sync app uses the [`pyzk`](https://github.com/fananimi/pyzk) library, which communicates via the standard ZKTeco TCP/IP protocol (port 4370). It is compatible with **any networked ZKTeco device** that supports this protocol — not just the ZK3969. It is **not** compatible with biometric devices from other brands (e.g. Suprema, HikVision, Anviz), as those use different communication protocols.

---

## Screenshots

> *(Coming soon)*

---

## License

This project was developed as a custom internal HR system. All rights reserved.
