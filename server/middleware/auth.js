const jwt = require("jsonwebtoken");
require("dotenv").config();
const getCookieValue = require("../helper/cookieHandler");
const User = require("../model/User");

const refreshToken = (res, email, userId, ip, userAgent) => {
  const secret = process.env.SECRET;
  if (!secret) {
    throw new Error("Server configuration error: Missing SECRET");
  }

  const expireTime = parseInt(process.env.LOGIN_EXPIRES) || 604800; // Default to 7 days in seconds
  const token = jwt.sign(
    {
      email: email,
      userId: userId,
      ip: ip,
      userAgent: userAgent,
      expireTime: Date.now() + (expireTime * 1000) // Convert to milliseconds for storage
    },
    secret,
    { expiresIn: expireTime } // Pass as seconds
  );

  const options = {
    maxAge: expireTime * 1000, // Convert to milliseconds for cookie
    httpOnly: true,
    path: '/',
    sameSite: process.env.APPLICATION_START_MODE === "production" ? "None" : "lax",
    secure: process.env.APPLICATION_START_MODE === "production"
  };

  if (process.env.APPLICATION_START_MODE === "production") {
    options.domain = process.env.DOMAIN || "localhost";
  }

  res.cookie("user_token", token, options);
  res.cookie("isLogin", "yes", options);
};

module.exports = async (req, res, next) => {
  try {
    const cookieString = req.headers.cookie;
    if (!cookieString) {
      const error = new Error("Authentication required");
      error.statusCode = 401;
      throw error;
    }

    const token = getCookieValue.getCookieValue(cookieString, "user_token");
    const isLogin = getCookieValue.getCookieValue(cookieString, "isLogin");

    if (isLogin !== "yes" || !token) {
      const error = new Error("Authentication required");
      error.statusCode = 401;
      throw error;
    }

    const secret = process.env.SECRET;
    if (!secret) {
      const error = new Error("Server configuration error: Missing SECRET");
      error.statusCode = 500;
      throw error;
    }

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, secret);
    } catch (err) {
      console.error('Token verification error:', err);
      // If token is expired, try to refresh it if possible
      if (err.name === 'TokenExpiredError') {
        try {
          const decodedWithoutVerify = jwt.decode(token);
          if (decodedWithoutVerify && decodedWithoutVerify.userId) {
            const user = await User.findById(decodedWithoutVerify.userId);
            if (user) {
              refreshToken(
                res,
                decodedWithoutVerify.email,
                decodedWithoutVerify.userId,
                decodedWithoutVerify.ip,
                decodedWithoutVerify.userAgent
              );
              req.userId = decodedWithoutVerify.userId;
              return next();
            }
          }
        } catch (refreshError) {
          console.error('Token refresh error:', refreshError);
        }
      }
      const error = new Error("Invalid or expired token");
      error.statusCode = 401;
      throw error;
    }

    if (!decodedToken) {
      const error = new Error("Invalid token");
      error.statusCode = 401;
      throw error;
    }

    req.userId = decodedToken.userId;

    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    const isTokenBlocked = user.blockedToken.some(
      (blockedToken) => blockedToken.type === token
    );

    if (isTokenBlocked) {
      const error = new Error("Token has been invalidated");
      error.statusCode = 401;
      throw error;
    }

    // Refresh token if it's within the last 24 hours of expiration
    const expireTime = parseInt(process.env.LOGIN_EXPIRES) || 604800;
    const refreshThreshold = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const tokenExpirationTime = decodedToken.expireTime;
    const currentTime = Date.now();
    const timeUntilExpiration = tokenExpirationTime - currentTime;

    if (timeUntilExpiration <= refreshThreshold) {
      refreshToken(
        res,
        decodedToken.email,
        decodedToken.userId,
        decodedToken.ip,
        decodedToken.userAgent
      );
    }

    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    return res.status(err.statusCode).json({
      error: 'yes',
      errors: {
        message: err.message || "Authentication failed",
        statusCode: err.statusCode
      }
    });
  }
};
