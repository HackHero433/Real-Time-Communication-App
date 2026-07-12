import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      const data = await register(form.name, form.email, form.password);
      navigate(`/verify-email?email=${encodeURIComponent(form.email)}`, {
        state: {
          message: data.message,
          developmentOtp: data.developmentOtp
        }
      });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="auth-shell">
      <form className="auth-card" onSubmit={submit}>
        <h1>Create account</h1>
        <label>
          Name
          <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        </label>
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
        <button type="submit">Register</button>
        <p className="helper-text">You will verify your email before signing in.</p>
        <p>
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </main>
  );
}
