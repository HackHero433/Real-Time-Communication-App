import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const successMessage = location.state?.message;

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      await login(form.email, form.password);
      navigate("/");
    } catch (err) {
      if (err.code === "EMAIL_NOT_VERIFIED") {
        navigate(`/verify-email?email=${encodeURIComponent(err.email || form.email)}`, {
          state: { message: err.message }
        });
        return;
      }
      setError(err.message);
    }
  }

  return (
    <main className="auth-shell">
      <form className="auth-card" onSubmit={submit}>
        <h1>Realtime Comm</h1>
        {successMessage && <p className="success">{successMessage}</p>}
        <label>
          Email
          <input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        </label>
        <label>
          Password
          <input
            type="password"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit">Sign in</button>
        <p className="helper-text">
          <Link to="/forgot-password">Forgot your password?</Link>
        </p>
        <p>
          New here? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </main>
  );
}
