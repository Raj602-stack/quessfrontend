import { useState, useEffect } from "react";
import api from "../api/axios";
import Loader from "../components/Loader";

function getTodayLocal() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
const TODAY = getTodayLocal();

// Backend expects capitalized choices (e.g. Django: choices=[('Present', 'Present'), ('Absent', 'Absent')])
const STATUS_PRESENT = "Present";
const STATUS_ABSENT = "Absent";

function normalizeStatus(s) {
  if (!s) return null;
  const lower = String(s).toLowerCase();
  if (lower === "present") return "present";
  if (lower === "absent") return "absent";
  return null;
}

function isWeekend(dateStr) {
  if (!dateStr) return false;
  const date = new Date(dateStr + "T00:00:00");
  const day = date.getDay();
  return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
}

function getPreviousWeekday(dateStr) {
  if (!dateStr) return dateStr;
  const date = new Date(dateStr + "T00:00:00");
  while (isWeekend(date.toISOString().slice(0, 10))) {
    date.setDate(date.getDate() - 1);
  }
  return date.toISOString().slice(0, 10);
}

export default function Attendance() {
  const [viewDate, setViewDate] = useState(() => {
    const today = new Date().toISOString().slice(0, 10);
    return isWeekend(today) ? getPreviousWeekday(today) : today;
  });
  const [markDate, setMarkDate] = useState(() => {
    const today = new Date().toISOString().slice(0, 10);
    return isWeekend(today) ? getPreviousWeekday(today) : today;
  });
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]); // from EmployeeViewSet (includes employee_id, full_name, etc.)
  // Map employee id -> name for View Attendance (API often returns only employee id)
  const [employeeNameMap, setEmployeeNameMap] = useState({});
  const [viewLoading, setViewLoading] = useState(false);
  const [markLoadings, setMarkLoadings] = useState({ fetch: false, save: false });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Mark attendance: for each employee, "present" | "absent" | null (unsaved)
  const [markByEmployee, setMarkByEmployee] = useState({});
  // Store existing attendance record IDs: { employeeId: attendanceRecordId }
  const [existingAttendanceIds, setExistingAttendanceIds] = useState({});
  // Dates for which attendance was saved in this session (editing disabled)
  const [appliedDates, setAppliedDates] = useState(() => new Set());
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  const isFutureDate = (dateStr) => dateStr && dateStr > TODAY;
  const isMarkDateLocked = appliedDates.has(markDate);

  const openSaveConfirm = () => setShowSaveConfirm(true);
  const closeSaveConfirm = () => setShowSaveConfirm(false);

  const handleViewDateChange = (e) => {
    const selectedDate = e.target.value;
    if (isWeekend(selectedDate)) {
      const weekdayDate = getPreviousWeekday(selectedDate);
      setViewDate(weekdayDate);
      setError("Weekends are not allowed. Date adjusted to previous weekday.");
      setTimeout(() => setError(""), 3000);
    } else {
      setViewDate(selectedDate);
    }
  };

  const handleMarkDateChange = (e) => {
    const selectedDate = e.target.value;
    if (isWeekend(selectedDate)) {
      const weekdayDate = getPreviousWeekday(selectedDate);
      setMarkDate(weekdayDate);
      setError("Weekends are not allowed. Date adjusted to previous weekday.");
      setTimeout(() => setError(""), 3000);
    } else {
      setMarkDate(selectedDate);
    }
  };

  useEffect(() => {
    fetchViewAttendance();
  }, [viewDate]);

  useEffect(() => {
    if (markDate && !isFutureDate(markDate)) {
      loadEmployeesAndExistingForMark();
    }
  }, [markDate]);

  const fetchViewAttendance = async () => {
    if (!viewDate) return;
    if (isFutureDate(viewDate)) {
      setError("Cannot view attendance for future dates.");
      setRecords([]);
      setEmployeeNameMap({});
      return;
    }
    setViewLoading(true);
    setError("");
    try {
      const [attRes, empRes] = await Promise.all([
        api.get(`attendance/?date=${viewDate}`),
        api.get("employees/").catch(() => ({ data: [] })),
      ]);
      const attList = Array.isArray(attRes.data) ? attRes.data : [];
      const empList = Array.isArray(empRes.data) ? empRes.data : [];
      setRecords(attList);

      // Build id -> name so we can show names when API only returns employee id
      const nameMap = {};
      empList.forEach((e) => {
        nameMap[e.id] = e.full_name || e.employee_id || "—";
      });
      setEmployeeNameMap(nameMap);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load attendance.");
      setRecords([]);
      setEmployeeNameMap({});
    } finally {
      setViewLoading(false);
    }
  };

  const loadEmployeesAndExistingForMark = async () => {
    if (!markDate) return;
    if (isFutureDate(markDate)) {
      setError("Attendance cannot be marked for future dates.");
      return;
    }
    setMarkLoadings((prev) => ({ ...prev, fetch: true }));
    setError("");
    setSuccess("");
    try {
      const [empRes, attRes] = await Promise.all([
        api.get("employees/"),
        api.get(`attendance/?date=${markDate}`).catch(() => ({ data: [] })),
      ]);
      const empList = Array.isArray(empRes.data) ? empRes.data : empRes.data?.results ?? [];
      const attList = Array.isArray(attRes.data) ? attRes.data : attRes.data?.results ?? [];
      setEmployees(empList);

      const byEmp = {};
      const attIds = {};
      empList.forEach((e) => {
        const existing = attList.find(
          (a) =>
            a.employee === e.id || // FK pk (reliable for new and existing employees)
            a.employee_id === e.employee_id ||
            a.employee_employee_id === e.employee_id ||
            String(a.employee_name || "").toLowerCase() === String(e.full_name || "").toLowerCase()
        );
        // Key by emp.id so new employees (who may not have employee_id in response) always work
        const key = e.id;
        byEmp[key] = existing ? (normalizeStatus(existing.status) === "present" ? "present" : "absent") : null;
        if (existing && existing.id) {
          attIds[key] = existing.id;
        }
      });
      setMarkByEmployee(byEmp);
      setExistingAttendanceIds(attIds);
      if (attList.length > 0) {
        setAppliedDates((prev) => new Set(prev).add(markDate));
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load employees.");
      setEmployees([]);
      setMarkByEmployee({});
      setExistingAttendanceIds({});
    } finally {
      setMarkLoadings((prev) => ({ ...prev, fetch: false }));
    }
  };

  const setAttendanceForEmployee = (employeeId, value) => {
    setMarkByEmployee((prev) => ({ ...prev, [employeeId]: value }));
  };

  const saveMarkAttendance = async () => {
    if (!markDate || employees.length === 0) return;
    if (isFutureDate(markDate)) {
      setError("Attendance cannot be marked for future dates.");
      return;
    }
    setMarkLoadings((prev) => ({ ...prev, save: true }));
    setError("");
    setSuccess("");
    try {
      // Process each employee: POST new or PATCH existing (send capitalized status for Django choices)
      const results = await Promise.allSettled(
        employees.map(async (emp) => {
          const key = emp.id;
          const status = markByEmployee[key] === "present" ? STATUS_PRESENT : STATUS_ABSENT;
          const attendanceId = existingAttendanceIds[key];

          if (attendanceId) {
            return api.patch(`attendance/${attendanceId}/`, { status });
          } else {
            return api.post("attendance/", {
              employee: emp.id,
              date: markDate,
              status,
            });
          }
        })
      );

      const failures = results
        .map((result, idx) => {
          if (result.status === "rejected") {
            const emp = employees[idx];
            const err = result.reason;
            const msg =
              err.response?.data?.detail ||
              (err.response?.data && typeof err.response.data === "object"
                ? JSON.stringify(err.response.data)
                : String(err.response?.data)) ||
              err.message ||
              "Unknown error";
            return `${emp?.full_name || `Employee ${idx + 1}`}: ${msg}`;
          }
          return null;
        })
        .filter(Boolean);

      if (failures.length > 0) {
        setError(
          failures.length === employees.length
            ? `Failed to save attendance: ${failures.join("; ")}`
            : `Partially saved. Errors: ${failures.join("; ")}`
        );
        if (failures.length < employees.length) {
          setSuccess(`Attendance saved for ${employees.length - failures.length} employee(s).`);
        }
      } else {
        setSuccess("Attendance saved for " + markDate + ".");
        setAppliedDates((prev) => new Set(prev).add(markDate));
      }

      // refresh both view + mark sections for this date
      fetchViewAttendance();
      loadEmployeesAndExistingForMark();
    } catch (err) {
      const detail = err.response?.data?.detail || err.response?.data;
      setError(typeof detail === "object" ? JSON.stringify(detail) : detail || "Failed to save attendance.");
    } finally {
      setMarkLoadings((prev) => ({ ...prev, save: false }));
    }
  };

  const handleSaveConfirm = () => {
    closeSaveConfirm();
    saveMarkAttendance();
  };

  return (
    <>
      <header className="page-header">
        <h1 className="page-title">Attendance</h1>
        <p className="page-subtitle">View and mark attendance by date</p>
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

      {/* ---------- View Attendance ---------- */}
      <div className="card">
        <h3 className="card__title">View Attendance</h3>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap" }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Date</label>
            <input
              type="date"
              className="input"
              value={viewDate}
              max={TODAY}
              onChange={handleViewDateChange}
              style={{ maxWidth: "180px" }}
            />
          </div>
        </div>
        {viewLoading ? (
          <div className="loader loader--full">
            <Loader size="large" />
          </div>
        ) : isFutureDate(viewDate) ? (
          <p className="empty-state" style={{ color: "var(--color-danger)" }}>
            Cannot view attendance for future dates.
          </p>
        ) : records.length === 0 ? (
          <p className="empty-state">No attendance records for this date.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => {
                  const isPresent = normalizeStatus(r.status) === "present";
                  const name =
                    r.employee_name ??
                    r.full_name ??
                    (r.employee != null ? employeeNameMap[r.employee] : null) ??
                    "—";
                  return (
                    <tr key={r.id}>
                      <td>{name}</td>
                      <td>
                        <span className={`status-badge status-badge--${isPresent ? "present" : "absent"}`}>
                          {isPresent ? "Present" : "Absent"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ---------- Mark Attendance ---------- */}
      <div className="card">
        <h3 className="card__title">Mark Attendance</h3>
        <p className="page-subtitle" style={{ marginBottom: "1rem" }}>
          Select a date, then choose Present or Absent for each employee and save.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end", marginBottom: "1rem", flexWrap: "wrap" }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Date</label>
            <input
              type="date"
              className="input"
              value={markDate}
              max={TODAY}
              onChange={handleMarkDateChange}
              style={{ maxWidth: "180px" }}
            />
          </div>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={loadEmployeesAndExistingForMark}
            disabled={markLoadings.fetch || !markDate || isFutureDate(markDate)}
          >
            {markLoadings.fetch ? (
              <>
                <Loader size="small" />
                Load…
              </>
            ) : (
              "Load employees for this date"
            )}
          </button>
        </div>

        {markLoadings.fetch ? (
          <div className="loader loader--full">
            <Loader size="large" />
          </div>
        ) : employees.length === 0 && Object.keys(markByEmployee).length === 0 ? (
          <p className="empty-state">Click “Load employees for this date” to mark attendance.</p>
        ) : employees.length === 0 ? null : (
          <>
            {isMarkDateLocked && (
              <p className="message message--success" style={{ marginBottom: "1rem" }}>
                Attendance for this date has been applied. Editing is disabled.
              </p>
            )}
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Present</th>
                    <th>Absent</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr key={emp.id}>
                      <td>{emp.full_name}</td>
                      <td>
                        <div className="checkbox-group">
                          <input
                            type="checkbox"
                            id={`present-${emp.id}`}
                            checked={markByEmployee[emp.id] === "present"}
                            onChange={() => setAttendanceForEmployee(emp.id, "present")}
                            disabled={isMarkDateLocked}
                          />
                          <label htmlFor={`present-${emp.id}`}>Present</label>
                        </div>
                      </td>
                      <td>
                        <div className="checkbox-group">
                          <input
                            type="checkbox"
                            id={`absent-${emp.id}`}
                            checked={markByEmployee[emp.id] === "absent"}
                            onChange={() => setAttendanceForEmployee(emp.id, "absent")}
                            disabled={isMarkDateLocked}
                          />
                          <label htmlFor={`absent-${emp.id}`}>Absent</label>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              className="btn btn--success"
              onClick={openSaveConfirm}
              disabled={markLoadings.save || isFutureDate(markDate) || isMarkDateLocked}
              style={{ marginTop: "1rem" }}
            >
              {markLoadings.save ? (
                <>
                  <Loader size="small" />
                  Saving…
                </>
              ) : isMarkDateLocked ? (
                "Attendance applied (editing disabled)"
              ) : (
                "Save attendance"
              )}
            </button>
          </>
        )}
      </div>

      {/* Save attendance confirmation popup */}
      {showSaveConfirm && (
        <div
          className="delete-confirm-overlay"
          onClick={closeSaveConfirm}
          role="dialog"
          aria-modal="true"
          aria-labelledby="save-attendance-confirm-title"
        >
          <div className="delete-confirm-popup" onClick={(e) => e.stopPropagation()}>
            <h3 id="save-attendance-confirm-title" className="delete-confirm-title">
              Confirm save attendance
            </h3>
            <p className="delete-confirm-message">
              Once saved, attendance for this date <strong>cannot be edited</strong>. This ensures the credibility of the data. Are you sure you want to save?
            </p>
            <div className="delete-confirm-actions">
              <button type="button" className="btn btn--secondary" onClick={closeSaveConfirm}>
                Cancel
              </button>
              <button type="button" className="btn btn--success" onClick={handleSaveConfirm}>
                Yes, save attendance
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
