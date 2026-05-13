const express = require("express");
const path = require("path");
const session = require("express-session");
require("dotenv").config();
const app = express();
const routes = require("./common/routes");

app.set("view engine", "ejs");
app.use(express.json()); // Parse JSON request bodies

// Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || "default-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }, // 24 hours
  }),
);

app.use(
  "/assets",
  (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Cache-Control", "public, max-age=31536000");
    next();
  },
  express.static(path.join(__dirname, "assets")),
);
app.use("/", routes);

app.set("views", path.join(__dirname, "modules"));
app.listen(3000, "0.0.0.0", () => {
  console.log("Server running on port 3000");
});
