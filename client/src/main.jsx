import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { RoomProvider } from "./context/RoomContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import Lobby from "./pages/Lobby";
import MeetingRoom from "./pages/MeetingRoom";
import "./styles.css";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="center-screen">Loading...</div>;
  if (user && user.emailVerified === false) {
    return <Navigate to={`/verify-email?email=${encodeURIComponent(user.email)}`} replace />;
  }
  return user ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RoomProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Lobby />
                </ProtectedRoute>
              }
            />
            <Route
              path="/rooms/:roomId"
              element={
                <ProtectedRoute>
                  <MeetingRoom />
                </ProtectedRoute>
              }
            />
          </Routes>
        </RoomProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
