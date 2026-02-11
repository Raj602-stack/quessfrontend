# HRMS Lite — Frontend

A React-based frontend for a lightweight Human Resource Management System (HRMS). It provides admin login, employee management, and date-wise attendance viewing and marking.

## Tech Stack

- **React 18** with JSX
- **Vite 5** — build tool and dev server
- **React Router 6** — client-side routing
- **Axios** — HTTP client with token auth

## Features

- **Login** — Token-based admin authentication
- **Dashboard** — Quick links to Employees and Attendance
- **Employees** — Create employees, view list with days present, delete with confirmation popup
- **Attendance** — View attendance by date; mark attendance (Present/Absent) per employee with date picker limited to today and past dates
- **About Me** — Side bookmark that opens a popup with developer info

## Prerequisites

- Node.js 18+ (or compatible)
- npm or yarn

## Installation

```bash
# Clone or download the project, then:
cd hrms-frontend
npm install
```

## Running the App

```bash
# Development (with hot reload)
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

After `npm run dev`, open the URL shown in the terminal (e.g. `http://localhost:5173`).

## Demo Credentials

For demo or testing:

- **Username:** `admin`
- **Password:** `12345`

(Shown on the login page.)

## Project Structure

```
src/
├── api/
│   └── axios.js          # Axios instance, base URL, auth header
├── components/
│   ├── AboutMe.jsx        # Side bookmark + popup
│   ├── Layout.jsx        # Sidebar + main content wrapper
│   ├── Loader.jsx        # Spinner component
│   └── ProtectedRoute.jsx # Auth guard for routes
├── pages/
│   ├── Login.jsx          # Admin login
│   ├── Dashboard.jsx     # Dashboard with links
│   ├── Employees.jsx      # Create, list, delete employees
│   └── Attendance.jsx     # View & mark attendance by date
├── App.jsx                # Routes and layout
├── main.jsx               # Entry point
└── index.css              # Global styles and theme
```

## API / Backend

The app talks to a REST API. The base URL is set in `src/api/axios.js`:

- **Base URL:** `https://splendid-wholeness-production-ecb0.up.railway.app/api/`

Endpoints used:

- `POST /token/` — Login (username, password) → returns token
- `GET/POST /employees/` — List and create employees
- `DELETE /employees/{id}/` — Delete employee
- `GET /attendance/?date=YYYY-MM-DD` — List attendance for a date
- `POST /attendance/` — Create attendance (employee, date, status)
- `PATCH /attendance/{id}/` — Update attendance (status)

Auth: requests send `Authorization: Token <token>` after login; token is stored in `localStorage`.

To point to another backend, change `baseURL` in `src/api/axios.js` (or use an env variable and reference it there).

## Attendance Rules

- **View Attendance** — Date picker and list are limited to today and past dates (no future).
- **Mark Attendance** — Same: only today or past dates; each employee has Present/Absent checkboxes; save creates or updates records via the API.

## License

Private / use as needed.
