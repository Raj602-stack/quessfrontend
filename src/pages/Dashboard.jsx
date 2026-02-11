import { Link } from "react-router-dom";

export default function Dashboard() {
  return (
    <>
      <header className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Overview and quick actions</p>
      </header>

      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <Link to="/employees" className="card" style={{ flex: "1", minWidth: "200px", textDecoration: "none", color: "inherit" }}>
          <h3 className="card__title">Employees</h3>
          <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
            View and manage employees
          </p>
        </Link>
        <Link to="/attendance" className="card" style={{ flex: "1", minWidth: "200px", textDecoration: "none", color: "inherit" }}>
          <h3 className="card__title">Attendance</h3>
          <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
            View and mark attendance by date
          </p>
        </Link>
      </div>
    </>
  );
}
