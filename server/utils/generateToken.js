import jwt from "jsonwebtoken";

export function generateAccessToken(user) {
  return jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: "15m"
  });
}

export function generateRefreshToken(user) {
  return jwt.sign({ id: user._id, email: user.email }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d"
  });
}

export function setAuthCookies(res, accessToken, refreshToken) {
  const secure = process.env.NODE_ENV === "production";
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    maxAge: 15 * 60 * 1000
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}
