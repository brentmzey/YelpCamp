// Add in Express router
const Campground = require("../models/campground"),
  nodemailer = require("nodemailer"),
  passport = require("passport"),
  Comment = require("../models/comment"),
  express = require("express"),
  router = express.Router(),
  crypto = require("crypto"),
  async = require("async"),
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
  if (req.body.adminCode === process.env.adminCode) {
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
      req.flash("error", "Well this is awkward, we couldn't find that user.");
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
        res.render("users/show", { user: foundUser, campgrounds: campgrounds, page: "user" });
      });
    // .catch((err) => {
    //   req.flash("error", "Uhmm, could not find that user.");
    // });
  });
});

// Forgot Password GET form route
router.get("/forgot", (req, res) => {
  res.render("users/forgot");
});

// Forgot Password POST route
router.post("/forgot", (req, res, next) => {
  async.waterfall(
    [
      (done) => {
        crypto.randomBytes(20, (err, buf) => {
          let token = buf.toString("hex");
          done(err, token);
        });
      },
      (token, done) => {
        User.findOne({ email: req.body.email }, (err, user) => {
          if (err || !user) {
            req.flash("error", "No account with that email address exists.");
            return res.redirect("/forgot");
          }

          user.resetPasswordToken = token;
          user.resetPasswordExpires = Date.now() + 36000000; // gives 1 hour to reset password

          user.save((err) => {
            done(err, token, user);
          });
        });
      },
      (token, user, done) => {
        let smtpTransport = nodemailer.createTransport({
          service: "Gmail",
          auth: {
            user: "camp.wisco@gmail.com",
            pass: process.env.GMAILPW,
          },
        });
        let mailOptions = {
          to: user.email,
          from: "camp.wisco@gmail.com",
          subject: "Reset your CampWI Password",
          text:
            "You are receiving this because you (or someone else) requested to reset your CampWI account password.\n\n" +
            "Please click on the following link, or paste this into your browser to complete the process:\n\n" +
            "http://" +
            req.headers.host +
            "/reset/" +
            token +
            "\n\n" +
            "If you did not request this, please ignore this email and your password will remain unchanged.\n\n" +
            "This code will expire in 1 hour.",
        };
        smtpTransport.sendMail(mailOptions, (err) => {
          req.flash("success", "An email has been sent to " + user.email + " with further instructions.");
          done(err, "done");
        });
      },
    ],
    (err) => {
      if (err) return next(err);
      res.redirect("/forgot");
    }
  );
});

// ===============================================
// ROUTES TO RESET PASSWORD WITH TOKEN FROM EMAIL
// ===============================================
router.get("/reset/:token", (req, res) => {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, (err, user) => {
    if (!user) {
      req.flash("error", "Password reset token is invalid or has expired.");
      return res.redirect("/forgot");
    }
    res.render("users/reset", { token: req.params.token });
  });
});

router.post("/reset/:token", (req, res) => {
  async.waterfall(
    [
      (done) => {
        User.findOne(
          { resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } },
          (err, user) => {
            if (!user || error) {
              req.flash("error", "Password reset token is invalid or has expired.");
              return res.redirect("back");
            }
            if (req.body.password === req.body.confirm) {
              user.setPassword(req.body.password, (err) => {
                user.resetPasswordToken = undefined;
                user.resetPasswordExpires = undefined;

                user.save((err) => {
                  req.logIn(user, (err) => {
                    done(err, user);
                  });
                });
              });
            } else {
              req.flash("error", "Passwords do not match.");
              return res.redirect("back");
            }
          }
        );
      },
      (user, done) => {
        let smtpTransport = nodemailer.createTransport({
          service: "Gmail",
          auth: {
            user: "camp.wisco@gmail.com",
            pass: process.env.GMAILPW,
          },
        });
        let mailOptions = {
          to: user.email,
          from: "camp.wisco@mail.com",
          subject: "Your CampWI password has been changed",
          text:
            "Hello,\n\n" +
            "This is a confirmation that the password for your account " +
            user.email +
            " has been changed.\n",
        };
        smtpTransport.sendMail(mailOptions, (err) => {
          if (err) {
            req.flash("error", "Uh oh, something went wrong attempting to email you regarding password a change.");
            res.redirect("/campgrounds");
          }
          req.flash("success", "Your password has been updated.");
          done(err);
        });
      },
    ],
    (err) => {
      req.flash("error", "Ooops, something went wrong on our end resetting your password.");
      res.redirect("/campgrounds");
    }
  );
});

module.exports = router;
