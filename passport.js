const passport = require("passport"),
  LocalStrategy = require("passport-local").Strategy,
  Models = require("./models.js"),
  passportJWT = require("passport-jwt");

let Users = Models.User,
  JWTStrategy = passportJWT.Strategy,
  ExtractJWT = passportJWT.ExtractJwt;

passport.use(
  new LocalStrategy(
    {
      usernameField: "username",
      passwordField: "password",
    },
    async (username, password, callback) => {
      console.log("Authenticating user:", username);
      await Users.findOne({ username: username })
        .then(async (user) => {
          if (!user) {
            console.log("User not found");
            return callback(null, false, {
              message: "Incorrect username or password.",
            });
          }
          const isValidPassword = await user.validatePassword(password);
          if (!isValidPassword) {
            console.log("Invalid password");
            return callback(null, false, { message: "Incorrect password." });
          }
          console.log("User authenticated successfully");
          return callback(null, user);
        })
        .catch((error) => {
          console.log("Error during authentication:", error);
          return callback(error);
        });
    }
  )
);

passport.use(
  new JWTStrategy(
    {
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
      secretOrKey: "your_jwt_secret",
    },
    async (jwtPayload, callback) => {
      console.log("Verifying token for user ID:", jwtPayload._id);
      return await Users.findById(jwtPayload._id)
        .then((user) => {
          if (!user) {
            console.log("User not found during token verification");
            return callback(null, false);
          }
          console.log("Token verified successfully");
          return callback(null, user);
        })
        .catch((error) => {
          console.log("Error during token verification:", error);
          return callback(error);
        });
    }
  )
);
