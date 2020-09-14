// Require our data models
const Campground = require("../models/campground"),
  Comment = require("../models/comment");

// All required middleware
const middlewareObj = {};

middlewareObj.escapeRegex = (text) => {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

middlewareObj.isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash("error", "You need to be logged in to submit a campground or comment.");
  // Need to declare this before a redirect
  res.redirect("/login");
};

middlewareObj.checkCampgroundOwnership = (req, res, next) => {
  // Is user logged in
  if (req.isAuthenticated()) {
    // is this user the creator/owner of the campground?
    Campground.findById(req.params.id, (err, foundCampground) => {
      if (err || !foundCampground) {
        // check for errors or null data objects since !null === true
        req.flash("error", "Well, this is awkward. We cannot find that campground. :/");
        res.redirect("back");
      } else {
        // is user the creator of this campground?
        if (foundCampground.author.id.equals(req.user._id) || req.user.isAdmin) {
          next();
        } else {
          // if not, redirect
          req.flash("error", "You need to be the campground creator to edit or delete.");
          res.redirect("back");
        }
      }
    });
  } else {
    // If not, redirect
    req.flash("error", "You need to be logged in to submit a campground or comment.");
    res.redirect("back");
  }
};

middlewareObj.checkCommentOwnership = (req, res, next) => {
  // Is any user logged in
  if (req.isAuthenticated()) {
    // is this user the creator/owner of the comment?
    Comment.findById(req.params.comment_id, (err, foundComment) => {
      if (err || !foundComment) {
        // check for & handle any query error
        req.flash("error", "Well, this is awkward. We cannot find that comment. :/");
        res.redirect("back");
      } else {
        // is user the creator of this comment?
        if (foundComment.author.id.equals(req.user._id) || req.user.isAdmin) {
          next();
        } else {
          // if not, redirect back
          req.flash("error", "You need to be the comment creator to edit or delete.");
          res.redirect("back");
        }
      }
    });
  } else {
    // If not, redirect back
    req.flash("error", "You need to be logged in to submit a campground or comment.");
    res.redirect("back");
  }
};

middlewareObj.pickRandomPhoto = () => {
  let bgPhotos = [
    "https://i.imgur.com/bYaEvsv.jpg",
    "https://i.imgur.com/g4MXt5A.jpg",
    "https://i.imgur.com/aOBxelU.jpg",
    "https://i.imgur.com/JtEY8cL.jpg",
    "https://i.imgur.com/VW6VObL.jpg",
  ];
  let random = Math.floor(Math.random() * 5);
  return bgPhotos[random];
};

module.exports = middlewareObj;

//     "/bg_photos/forest_tent_glow_night_camping.jpg",
//     "/bg_photos/james-wheeler-7x092PMauCg-unsplash.jpg",
//     "/bg_photos/michael-guite-1o41Wy3Z3kc-unsplash.jpg",
//     "/bg_photos/scott-goodwill-y8Ngwq34_Ak-unsplash.jpg",
//     "/bg_photos/tim-foster-jbBR9jbKzwY-unsplash.jpg",
