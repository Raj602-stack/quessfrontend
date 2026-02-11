import { useEffect, useState } from "react";
import api from "../api/axios";
import Loader from "../components/Loader";

function isPresent(status) {
  if (!status) return false;
  return String(status).toLowerCase() === "present";
}

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [daysPresentMap, setDaysPresentMap] = useState({}); // employee id -> count
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteConfirmEmployee, setDeleteConfirmEmployee] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    employee_id: "",
    full_name: "",
    email: "",
    department: "",
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    setError("");
    try {
      const empRes = await api.get("employees/");
      const empList = Array.isArray(empRes.data) ? empRes.data : empRes.data?.results ?? [];
      setEmployees(empList);

      // Fetch attendance and compute days present in the frontend
      const attRes = await api.get("attendance/").catch(() => ({ data: [] }));
      const attList = Array.isArray(attRes.data) ? attRes.data : attRes.data?.results ?? [];
      const countByEmployee = {};
      attList.forEach((r) => {
        const empId = r.employee ?? r.employee_id;
        if (empId == null) return;
        if (!isPresent(r.status)) return;
        countByEmployee[empId] = (countByEmployee[empId] ?? 0) + 1;
      });
      setDaysPresentMap(countByEmployee);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load employees.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess("");
    setError("");
    setSubmitLoading(true);
    try {
      await api.post("employees/", form);
      setSuccess("Employee created successfully.");
      setForm({
        employee_id: "",
        full_name: "",
        email: "",
        department: "",
      });
      fetchEmployees();
    } catch (err) {
      const msg = err.response?.data
        ? typeof err.response.data === "object"
          ? Object.values(err.response.data).flat().join(" ") || "Error creating employee"
          : String(err.response.data)
        : "Error creating employee";
      setError(msg);
    } finally {
      setSubmitLoading(false);
    }
  };

  const openDeleteConfirm = (emp) => setDeleteConfirmEmployee(emp);
  const closeDeleteConfirm = () => setDeleteConfirmEmployee(null);

  const handleDeleteConfirm = async () => {
    const emp = deleteConfirmEmployee;
    if (!emp) return;
    setError("");
    setSuccess("");
    setDeletingId(emp.id);
    try {
      await api.delete(`employees/${emp.id}/`);
      setSuccess(`${emp.full_name} removed successfully.`);
      setDeleteConfirmEmployee(null);
      fetchEmployees();
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        (err.response?.data && typeof err.response.data === "object"
          ? Object.values(err.response.data).flat().join(" ")
          : String(err.response.data)) ||
        "Could not delete employee.";
      setError(msg);
      setDeleteConfirmEmployee(null);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <header className="page-header">
        <h1 className="page-title">Employees</h1>
        <p className="page-subtitle">Manage employee records</p>
      </header>

      {error && (
        <div className="message message--error" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="message message--success" role="status">
          {success}
        </div>
      )}

      <div className="card">
        <h3 className="card__title">Create Employee</h3>
        <form onSubmit={handleSubmit} style={{ maxWidth: "400px" }}>
          <div className="form-group">
            <label>Employee ID</label>
            <input
              name="employee_id"
              className="input"
              placeholder="Employee ID"
              value={form.employee_id}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Full Name</label>
            <input
              name="full_name"
              className="input"
              placeholder="Full Name"
              value={form.full_name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              name="email"
              type="email"
              className="input"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Department</label>
            <input
              name="department"
              className="input"
              placeholder="Department"
              value={form.department}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" className="btn btn--primary" disabled={submitLoading}>
            {submitLoading ? (
              <>
                <Loader size="small" />
                Creating…
              </>
            ) : (
              "Create Employee"
            )}
          </button>
        </form>
      </div>

      <div className="card">
        <h3 className="card__title">Employee List</h3>
        {loading ? (
          <div className="loader loader--full">
            <Loader size="large" />
          </div>
        ) : employees.length === 0 ? (
          <p className="empty-state">No employees yet. Create one above.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Days Present</th>
                  <th style={{ width: "100px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id}>
                    <td>{emp.full_name}</td>
                    <td>{emp.department}</td>
                    <td>{daysPresentMap[emp.id] ?? emp.total_present ?? "—"}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn--danger"
                        onClick={() => openDeleteConfirm(emp)}
                        disabled={deletingId !== null}
                        title={`Delete ${emp.full_name}`}
                      >
                        {deletingId === emp.id ? (
                          <>
                            <Loader size="small" />
                            Deleting…
                          </>
                        ) : (
                          "Delete"
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete confirmation popup */}
      {deleteConfirmEmployee && (
        <div
          className="delete-confirm-overlay"
          onClick={closeDeleteConfirm}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-confirm-title"
        >
          <div className="delete-confirm-popup" onClick={(e) => e.stopPropagation()}>
            <h3 id="delete-confirm-title" className="delete-confirm-title">
              Delete employee?
            </h3>
            <p className="delete-confirm-message">
              Are you sure you want to delete <strong>{deleteConfirmEmployee.full_name}</strong>? This cannot be undone.
            </p>
            <div className="delete-confirm-actions">
              <button type="button" className="btn btn--secondary" onClick={closeDeleteConfirm} disabled={deletingId === deleteConfirmEmployee.id}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn--danger"
                onClick={handleDeleteConfirm}
                disabled={deletingId === deleteConfirmEmployee.id}
              >
                {deletingId === deleteConfirmEmployee.id ? (
                  <>
                    <Loader size="small" />
                    Deleting…
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
