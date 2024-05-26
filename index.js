const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const Models = require("./models.js");
const { check, validationResult } = require("express-validator");
const cors = require("cors");
const app = express();
console.stack("Here I am");
const Movies = Models.Movie;
const Users = Models.User;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan("combined"));
app.use(express.static("public"));

const corsOptions = {
  origin: [
    "http://localhost:1234",
    "https://myflixv1-deebdbd0b5ba.herokuapp.com/",
  ],
  methods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));

// Apply CORS middleware with the options
app.use(cors(corsOptions));

// let allowedOrigins = [
// "http://localhost:1234", // Your local development server
// "https://myflixv1-deebdbd0b5ba.herokuapp.com", // Your deployed frontend URL (if you have one)
// ];
// Define CORS options

let auth = require("./auth")(app);
const passport = require("passport");
require("./passport");

// mongoose
//   .connect("mongodb://localhost:27017/myflixv1", {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   })
//   .then(() => {
//     console.log("Connected to the database");
//   })
//   .catch((err) => {
//     console.error("Database connection error:", err);
//   });

mongoose.connect(process.env.CONNECTION_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});

app.get("/test-error", (req, res) => {
  throw new Error("This is a test error!");
});

app.get("/", (req, res) => {
  res.send("Welcome to my app!");
});

// Movie CRUD GET
app.get(
  "/movies",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    Movies.find()
      .then((movies) => res.json(movies))
      .catch((error) => {
        console.error(error);
        res.status(500).send("Error: " + error);
      });
  }
);

// Get a movie by title (GET) READ
app.get(
  "/movies/:title",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    await Movies.findOne({ title: req.params.title })
      .then((movie) => {
        if (!movie) {
          return res.status(404).send(req.params.title + " was not found.");
        }
        res.json(movie);
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send("Error: " + error);
      });
  }
);

// Get a movie by genre (GET) READ
app.get(
  "/genre/:genreName",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    await Movies.findOne({ "genre.name": req.params.genreName })
      .then((movie) => {
        if (!movie) {
          return res.status(404).send(req.params.genreName + " was not found.");
        }
        res.json(movie);
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send("Error: " + error);
      });
  }
);

// Get a movie by director (GET) READ
app.get(
  "/directors/:directorName",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    await Movies.findOne({ "director.name": req.params.directorName })
      .then((movie) => {
        if (!movie) {
          return res.status(404).send("Director not found");
        }
        res.json(movie.director);
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send("Error: " + error);
      });
  }
);

// User CRUD GET/READ
app.get(
  "/users",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    await Users.find()
      .then((users) => res.status(200).json(users))
      .catch((error) => {
        console.error(error);
        res.status(500).send("Error: " + error);
      });
  }
);

// Get a user by username (GET) READ
app.get(
  "/users/:username",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    await Users.findOne({ username: req.params.username })
      .then((user) => {
        if (!user) {
          return res.status(404).send(req.params.username + " was not found.");
        }
        res.json(user);
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send("Error: " + error);
      });
  }
);

// Get a user's list of favorite movies (GET) READ
app.get(
  "/users/:username/favorites",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    await Users.findOne({ username: req.params.username })
      .populate("favoriteMovies")
      .then((user) => {
        if (!user) {
          return res.status(404).send(req.params.username + " was not found.");
        }
        res.json(user.favoriteMovies);
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send("Error: " + error);
      });
  }
);
console.stack("Here I am");
// User CRUD POST/CREATE
app.post(
  "/users",
  [
    check("username", "username is required").isLength({ min: 5 }),
    check(
      "username",
      "username contains non alphanumeric characters - not allowed."
    ).isAlphanumeric(),
    check("password", "password is required").not().isEmpty(),
    check("email", "email does not appear to be valid").isEmail(),
  ],
  async (req, res) => {
    console.log(req.body);
    // check the validation object for errors
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    let hashedPassword = await Users.hashPassword(req.body.password); // Use await here
    await Users.findOne({ username: req.body.username }) // Search to see if a user with the requested username already exists
      .then((user) => {
        if (user) {
          //If the user is found, send a response that it already exists
          return res.status(400).send(req.body.username + " already exists");
        } else {
          Users.create({
            username: req.body.username,
            password: hashedPassword,
            email: req.body.email,
            birthday: req.body.birthday,
          })
            .then((user) => {
              res.status(201).json(user);
            })
            .catch((error) => {
              console.error(error);
              res.status(500).send("Error: " + error);
            });
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send("Error: " + error);
      });
  }
);

// Add a movie to user's list of favorites (POST) CREATE
app.post(
  "/users/:username/movies/:movieId",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    await Users.findOneAndUpdate(
      { username: req.params.username },
      {
        $addToSet: { favoriteMovies: req.params.movieId },
      },
      { new: true }
    )
      .then((updatedUser) => res.json(updatedUser))
      .catch((error) => {
        console.error(error);
        res.status(500).send("Error: " + error);
      });
  }
);

// Update a users info by username (PUT) UPDATE
app.put(
  "/users/:username",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    // CONDITION TO CHECK ADDED HERE
    if (req.user.username !== req.params.username) {
      return res.status(400).send("Permission denied");
    }
    // CONDITION ENDS
    let hashedPassword = await Users.hashPassword(req.body.password);
    await Users.findOneAndUpdate(
      { username: req.params.username },
      {
        $set: {
          username: req.body.username,
          password: hashedPassword,
          email: req.body.email,
          birthday: req.body.birthday,
        },
      },
      { new: true }
    ) // This line makes sure that the updated document is returned
      .then((updatedUser) => {
        res.json(updatedUser);
      })
      .catch((err) => {
        console.log(err);
        res.status(500).send("Error: " + err);
      });
  }
);

// User CRUD DELETE
app.delete(
  "/users/:username",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    await Users.findOneAndDelete({ username: req.params.username })
      .then((user) => {
        if (!user) {
          return res.status(400).send(req.params.username + " was not found");
        }
        res.status(200).send(req.params.username + " was deleted.");
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send("Error: " + error);
      });
  }
);

// Remove a movie from user's list of favorites (DELETE) DELETE
app.delete(
  "/users/:username/movies/:movieId",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    await Users.findOneAndUpdate(
      { username: req.params.username },
      {
        $pull: { favoriteMovies: req.params.movieId },
      },
      { new: true }
    )
      .then((updatedUser) => res.json(updatedUser))
      .catch((error) => {
        console.error(error);
        res.status(500).send("Error: " + error);
      });
  }
);

// Other endpoints
app.get("/search", (req, res) => {
  res.send("Perform a search");
});

const port = process.env.PORT || 8080;
app.listen(port, "0.0.0.0", () => {
  console.log("Listening on Port " + port);
});

console.stack("Here I am");
