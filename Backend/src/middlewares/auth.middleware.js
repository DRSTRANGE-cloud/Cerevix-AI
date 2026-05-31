const jwt = require("jsonwebtoken");
const tokenBlacklistModel = require("../models/blacklist.model");
const { jwtSecret } = require("../config/env");

async function authUser(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1]; // ✅ read from header

  if (!token) {
    return res.status(401).json({ message: "Token not provided." });
  }

  const isTokenBlacklisted = await tokenBlacklistModel.findOne({
    token,
  });

  if (isTokenBlacklisted) {
    return res.status(401).json({
      message: "token is invalid",
    });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);

    req.user = decoded;

    next();
  } catch (err) {
    return res.status(401).json({
      message: "Invalid token.",
    });
  }
}

module.exports = { authUser };
