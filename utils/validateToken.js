const jwt = require("jsonwebtoken");
const ErrorHandler = require("./errorHandler");

const validateToken = (obj) => {
  const { authorization } = obj;

  if (!authorization || !authorization.startsWith("Bearer")) {
    throw new ErrorHandler("TOKEN_MISSING", 400);
  }

  try {
    const token = authorization.split(" ")[1];

    let verify_Token;

    verify_Token = jwt.verify(token, process.env.JWT_SECRET);

    return verify_Token;
  } catch (e) {
    throw new ErrorHandler("INVALID_TOKEN", 400);
  }
};
module.exports = { validateToken };
