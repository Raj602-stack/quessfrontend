import { Outlet, NavLink } from "react-router-dom";

export default function Layout() {
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar__logo">HRMS Lite</div>
        <nav className="sidebar__nav">
          <NavLink to="/dashboard" className="sidebar__link" end>Dashboard</NavLink>
          <NavLink to="/employees" className="sidebar__link">Employees</NavLink>
          <NavLink to="/attendance" className="sidebar__link">Attendance</NavLink>
        </nav>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
