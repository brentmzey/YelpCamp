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
    if (err || !campground) {
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
    if (err || !campground) {
      req.flash("error", "Uhrmmm, we could not find that campground.");
      console.log(err);
      res.redirect("/campgrounds/" + req.params.id); // eventually change to show a true comment
    } else {
      // create new comment
      Comment.create(req.body.comment, (err, comment) => {
        if (err || !comment) {
          req.flash("error", "Something went wrong on our end... :/");
          console.log(err);
          res.redirect("/campgrounds/" + req.params.id); // eventually change to show a true comment
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
          req.flash("success", "Successfully added your comment!");
          res.redirect("/campgrounds/" + campground._id);
        }
      });
    }
  });
});

// EDIT Comment Route
router.get("/:comment_id/edit", middleware.checkCommentOwnership, (req, res) => {
  Campground.findById(req.params.id, (err, foundCampground) => {
    if (err || !foundCampground) {
      req.flash("error", "Whoops, cannot find that campground.");
      return res.redirect("back");
    }
    // If no malicious user manipulation of campground_id in URL, then:
    // Find the comment & pass through to template
    Comment.findById(req.params.comment_id, (err, foundComment) => {
      if (err || !foundComment) {
        req.flash("error", "Uhrmmm, we could not find that comment.");
        res.redirect("back");
      } else {
        // console.log(req.params);
        // Also find & pass through campground_id & campground_name
        // let campground_id = req.params.id;
        Campground.findById(req.params.id, (err, foundCampground) => {
          if (err || !foundCampground) {
            req.flash("error", "Uhrmmm, we could not find that campground.");
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
});

// UPDATE Comment Route
router.put("/:comment_id", middleware.checkCommentOwnership, (req, res) => {
  Campground.findById(req.params.id, (err, foundCampground) => {
    if (err || !foundCampground) {
      req.flash("error", "Whoops, cannot find that campground.");
      return res.redirect("back");
    }
    // If no malicious user manipulation of campground_id in URL, then:
    // Find and update the correct campground
    Comment.findOneAndUpdate({ _id: req.params.comment_id }, req.body.comment, (err, updatedComment) => {
      if (err || !foundComment) {
        console.log(err);
        req.flash("error", "Uhrmmm, we could not find that comment.");
        res.redirect("back");
      } else {
        // Send back to the (hopefully) updated campground site w/ update comment
        req.flash("success", "Comment edited!");
        res.redirect("/campgrounds/" + req.params.id);
      }
    });
  });
});

// Comment DELETE Route
router.delete("/:comment_id", middleware.checkCommentOwnership, (req, res) => {
  // res.send("the comment delete route");
  Comment.findOneAndDelete({ _id: req.params.comment_id }, req.body.comment, (err, deletedComment) => {
    if (err || !deletedComment) {
      console.log(err);
      res.redirect("back");
    } else {
      // If successful send back to same campground page but this comment will have been deleted
      req.flash("success", "Comment deleted!");
      res.redirect("/campgrounds/" + req.params.id);
    }
  });
});

module.exports = router;
