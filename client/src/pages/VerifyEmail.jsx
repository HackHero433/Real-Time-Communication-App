import { useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function VerifyEmail() {
  const { verifyEmail, resendVerification } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState(location.state?.message || "");
  const [developmentOtp, setDevelopmentOtp] = useState(location.state?.developmentOtp || "");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await verifyEmail(email, otp);
      navigate("/login", { state: { message: data.message } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    setLoading(true);
    setError("");
    try {
      const data = await resendVerification(email);
      setMessage(data.message);
      setDevelopmentOtp(data.developmentOtp || "");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-shell auth-shell-accent">
      <form className="auth-card" onSubmit={submit}>
        <h1>Verify your email</h1>
        <p className="helper-text">Enter the six-digit OTP sent to your inbox to activate your coaching account.</p>
        {message && <p className="success">{message}</p>}
        <label>
          Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label>
          Verification code
          <input value={otp} maxLength={6} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))} />
        </label>
        {developmentOtp && <p className="helper-text">Development OTP: {developmentOtp}</p>}
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={loading}>
          Verify email
        </button>
        <button type="button" className="secondary-button" onClick={resend} disabled={loading || !email}>
          Resend OTP
        </button>
        <p>
          Back to <Link to="/login">Sign in</Link>
        </p>
      </form>
    </main>
  );
}
