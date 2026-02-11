import { useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import Loader from "../components/Loader";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("token/", { username, password });
      localStorage.setItem("token", res.data.token);
      navigate("/dashboard");
    } catch {
      setError("Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Admin Login</h1>
        <p className="page-subtitle" style={{ marginBottom: "1.5rem" }}>
          Sign in to manage HRMS
        </p>

        {error && (
          <div className="message message--error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              className="input"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              autoComplete="username"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="input"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
              required
            />
          </div>
          <button type="submit" className="btn btn--primary" disabled={loading}>
            {loading ? (
              <>
                <Loader size="small" />
                Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </button>

        <p className="login-demo-note" style={{ marginTop: "1.25rem", marginBottom: 0 }}>
          <strong>Demo:</strong> Username <code>admin</code>, Password <code>12345</code>
        </p>
        </form>
      </div>
    </div>
  );
}
