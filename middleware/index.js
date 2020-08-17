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
    "https://scontent-ort2-1.xx.fbcdn.net/v/t31.0-8/22538878_10155028497360686_139084624032688587_o.jpg?_nc_cat=109&_nc_sid=730e14&_nc_ohc=7CR5MWG2ol4AX_RoU8Y&_nc_ht=scontent-ort2-1.xx&oh=049f174ba81842104a74016bd0f5c082&oe=5F599C1B",
    "https://scontent-ort2-1.xx.fbcdn.net/v/t31.0-8/16601862_10154282908300686_8707619158598234577_o.jpg?_nc_cat=109&_nc_sid=9267fe&_nc_ohc=gNg_ORRqRsgAX8gsl9R&_nc_ht=scontent-ort2-1.xx&oh=991ec7162a20b247d5bd75486aa4341e&oe=5F5A60D1",
    "https://scontent-ort2-1.xx.fbcdn.net/v/t31.0-8/22135670_10154986493370686_8248602510981032174_o.jpg?_nc_cat=106&_nc_sid=730e14&_nc_ohc=LpNGuQtBiyEAX-4sx6f&_nc_ht=scontent-ort2-1.xx&oh=069eafef2c53a3de94454ea0dcf67d1e&oe=5F5C70E7",
    "https://scontent-ort2-1.xx.fbcdn.net/v/t31.0-8/11884683_10153012279250686_5610864382203928581_o.jpg?_nc_cat=106&_nc_sid=9267fe&_nc_ohc=C-G6B7GgJuQAX9-Wyjn&_nc_ht=scontent-ort2-1.xx&oh=6dc818a6e0ad03d7b28ada105b9d524e&oe=5F5A3B6E",
    "https://i.redd.it/rwazfs248nb31.jpg",
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
