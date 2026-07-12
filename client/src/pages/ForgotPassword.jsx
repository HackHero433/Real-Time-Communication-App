import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ForgotPassword() {
  const { requestPasswordReset, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [developmentOtp, setDevelopmentOtp] = useState("");
  const [loading, setLoading] = useState(false);

  async function requestOtp(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await requestPasswordReset(email);
      setMessage(data.message);
      setDevelopmentOtp(data.developmentOtp || "");
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function submitReset(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await resetPassword(email, otp, password);
      navigate("/login", { state: { message: data.message } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-shell auth-shell-accent">
      <form className="auth-card" onSubmit={step === 1 ? requestOtp : submitReset}>
        <h1>{step === 1 ? "Forgot password" : "Reset password"}</h1>
        <p className="helper-text">
          {step === 1
            ? "We will send a reset OTP to your registered email."
            : "Enter the OTP and choose a new password for your account."}
        </p>
        {message && <p className="success">{message}</p>}
        <label>
          Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        {step === 2 && (
          <>
            <label>
              Reset code
              <input value={otp} maxLength={6} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))} />
            </label>
            <label>
              New password
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>
            {developmentOtp && <p className="helper-text">Development OTP: {developmentOtp}</p>}
          </>
        )}
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={loading}>
          {step === 1 ? "Send reset OTP" : "Reset password"}
        </button>
        {step === 2 && (
          <button type="button" className="secondary-button" onClick={() => setStep(1)} disabled={loading}>
            Change email
          </button>
        )}
        <p>
          Back to <Link to="/login">Sign in</Link>
        </p>
      </form>
    </main>
  );
}
