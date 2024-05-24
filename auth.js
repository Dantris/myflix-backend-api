const jwt_secret = "your_jwt_secret";
const jwt = require("jsonwebtoken");
const passport = require("passport");

require("./passport");

let generateJWTToken = (user) => {
  return jwt.sign(user, jwt_secret, {
    subject: user.username,
    expiresIn: "7d",
    algorithm: "HS256",
  });
};

// POST login
module.exports = (router) => {
  router.post("/login", (req, res) => {
    passport.authenticate("local", { session: false }, (error, user, info) => {
      if (error || !user) {
        console.log("Authentication error or user not found:", error);
        return res.status(400).json({
          message: "Something is not right",
          user: user,
        });
      }
      req.login(user, { session: false }, (error) => {
        if (error) {
          console.log("Login error:", error);
          res.send(error);
        }
        let token = generateJWTToken(user.toJSON());
        console.log("Generated JWT token:", token);
        return res.json({ user, token });
      });
    })(req, res);
  });
};
