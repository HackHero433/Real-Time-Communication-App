import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../utils/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/api/auth/me")
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const data = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    localStorage.setItem("accessToken", data.accessToken);
    setUser(data.user);
  }

  async function register(name, email, password) {
    return api("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password })
    });
  }

  async function verifyEmail(email, otp) {
    return api("/api/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ email, otp })
    });
  }

  async function resendVerification(email) {
    return api("/api/auth/verify-email/resend", {
      method: "POST",
      body: JSON.stringify({ email })
    });
  }

  async function requestPasswordReset(email) {
    return api("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email })
    });
  }

  async function resetPassword(email, otp, password) {
    return api("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ email, otp, password })
    });
  }

  async function logout() {
    await api("/api/auth/logout", { method: "POST" }).catch(() => null);
    localStorage.removeItem("accessToken");
    setUser(null);
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      verifyEmail,
      resendVerification,
      requestPasswordReset,
      resetPassword,
      logout
    }),
    [user, loading]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
