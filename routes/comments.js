// Add in Express router
const Campground = require("../models/campground"),
  middleware = require("../middleware"),
  Comment = require("../models/comment"),
  express = require("express"),
  router = express.Router({ mergeParams: true });

// INDEX - Comments NEW
router.get("/new", middleware.isLoggedIn, (req, res) => {
  // Find campground by id
  Campground.findById(req.params.id, (err, campground) => {
    if (err) {
      console.log(err);
    } else {
      // pass through campground data object
      res.render("./comments/new", { campground: campground });
    }
  });
});

// CREATE - Comments CREATE
router.post("/", middleware.isLoggedIn, (req, res) => {
  // Lookup campground using ID
  Campground.findById(req.params.id, (err, campground) => {
    if (err) {
      console.log(err);
      res.redirect("/campgrounds"); // eventually change to show a true comment
    } else {
      // create new comment
      Comment.create(req.body.comment, (err, comment) => {
        if (err) {
          console.log(err);
        } else {
          // add username & id to comment
          comment.author.id = req.user._id;
          comment.author.username = req.user.username;
          // save comment
          comment.save();
          // connect new comment to campground
          campground.comments.push(comment);
          campground.save();
          // console.log(comment);
          // redirect TO CAMPGROUND SHOW PAGE
          res.redirect("/campgrounds/" + campground._id);
        }
      });
    }
  });
});

// EDIT Comment Route
router.get("/:comment_id/edit", middleware.checkCommentOwnership, (req, res) => {
  // Find the comment & pass through to template
  Comment.findById(req.params.comment_id, (err, foundComment) => {
    if (err) {
      res.redirect("back");
    } else {
      // console.log(req.params);
      // Also find & pass through campground_id & campground_name
      // let campground_id = req.params.id;
      Campground.findById(req.params.id, (err, foundCampground) => {
        if (err) {
          res.redirect("back");
        } else {
          let campground_name = foundCampground.name;
          //  Render template with comment, campground_id, & campground_name
          res.render("../views/comments/edit", {
            comment: foundComment,
            campground_id: req.params.id,
            campground_name: campground_name,
          });
        }
      });
    }
  });
});

// UPDATE Comment Route
router.put("/:comment_id", middleware.checkCommentOwnership, (req, res) => {
  // Find and update the correct campground
  Comment.findOneAndUpdate({ _id: req.params.comment_id }, req.body.comment, (err, updatedComment) => {
    if (err) {
      console.log(err);
      res.redirect("back");
    } else {
      // Send back to the (hopefully) updated campground site w/ update comment
      res.redirect("/campgrounds/" + req.params.id);
    }
  });
});

// Comment DELETE Route
router.delete("/:comment_id", middleware.checkCommentOwnership, (req, res) => {
  // res.send("the comment delete route");
  Comment.findOneAndDelete({ _id: req.params.comment_id }, req.body.comment, (err, deletedComment) => {
    if (err) {
      console.log(err);
      res.redirect("back");
    } else {
      // If successful send back to same campground page but this comment will have been deleted
      res.redirect("/campgrounds/" + req.params.id);
    }
  });
});

module.exports = router;
