// Add in Express router
const Campground = require("../models/campground"),
  passport = require("passport"),
  Comment = require("../models/comment"),
  express = require("express"),
  router = express.Router(),
  User = require("../models/user");

// Root Route path
router.get("/", (req, res) => {
  res.render("landing");
});

//=================
// AUTH ROUTES
//=================

// Show register form
router.get("/register", (req, res) => {
  res.render("register", { page: "register" });
});

// Handle sign up logic
router.post("/register", (req, res) => {
  let newUser = new User({
    username: req.body.username,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    avatar: req.body.avatar,
  });
  if (req.body.adminCode === "guardianOfRum") {
    newUser.isAdmin = true;
  }
  User.register(newUser, req.body.password, (err, user) => {
    if (err) {
      console.log(err);
      req.flash("error", err.message);
      return res.redirect("/register"); // if error, exit registration and re-display the register template
    }
    passport.authenticate("local")(req, res, () => {
      req.flash("success", "Welcome to CampWI, " + user.username);
      res.redirect("/campgrounds");
    });
  });
});

// Show login form
router.get("/login", (req, res) => {
  res.render("login", { page: "login" });
});

// Handling Login logic
router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/campgrounds",
    failureRedirect: "/login",
    failureFlash: true,
  }),
  (req, res) => {}
);

// LOGOUT Route
router.get("/logout", (req, res) => {
  req.logout();
  req.flash("success", "Successfully logged out! See you again soon!");
  res.redirect("/campgrounds");
});

// User Profile Route
router.get("/users/:user_id", (req, res) => {
  User.findById(req.params.user_id, (err, foundUser) => {
    if (err || !foundUser) {
      req.flash("error", "Well this is awkward, we couldn't find that user. <%= <i class='fas fa-sad-cry'></i> %>");
      return res.redirect("/campgrounds");
    }
    Campground.find()
      .where("author.id")
      .equals(foundUser._id)
      .exec((err, campgrounds) => {
        if (err || !campgrounds) {
          req.flash("error", "Well this is awkward, we're missing some data.");
          return res.redirect("/campgrounds");
        }
        res.render("users/show", { user: foundUser, campgrounds: campgrounds });
      });
    // .catch((err) => {
    //   req.flash("error", "Uhmm, could not find that user.");
    // });
  });
});

module.exports = router;
