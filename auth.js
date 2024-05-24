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
    const { username, password } = req.body;
    console.log(req.body);
    passport.authenticate("local", { session: false }, (error, user, info) => {
      if (!username || !password) {
        res.status(400).json({ message: "Username or password missing!" });
        return;
      }
      if (error || !user) {
        return res.status(400).json({
          message: "Something is not right",
          user: user,
        });
      }
      req.login(user, { session: false }, (error) => {
        if (error) {
          res.send(error);
        }
        let token = generateJWTToken(user.toJSON());
        return res.json({ user, token });
      });
    })(req, res);
  });
};
