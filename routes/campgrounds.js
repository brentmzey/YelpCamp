// Add in Express router
const Notification = require("../models/notification"),
  Campground = require("../models/campground"),
  middleware = require("../middleware"),
  Comment = require("../models/comment"),
  express = require("express"),
  router = express.Router();

//===================
// CAMPGROUND ROUTES
//===================
// INDEX - show all campgrounds
router.get("/", (req, res) => {
  let perPage = 6;
  let pageQuery = parseInt(req.query.page);
  let pageNumber = pageQuery ? pageQuery : 1;
  let noMatch = null;
  // Render the page
  if (req.query.search) {
    // If there's a query, run a MongoDB search with that query data
    const regex = new RegExp(middleware.escapeRegex(req.query.search), "gi");
    // Get all campgrounds from DB matching the REGEX
    Campground.find({ $or: [{ name: regex }, { location: regex }, { "author.username": regex }] })
      .skip(perPage * pageNumber - perPage)
      .limit(perPage)
      .exec((err, allCampgrounds) => {
        Campground.countDocuments({ $or: [{ name: regex }, { location: regex }, { "author.username": regex }] }).exec(
          (err, count) => {
            if (err || !allCampgrounds) {
              req.flash("error", "Well this is embarrassing, we failed to find some items... :/");
              res.redirect("/");
              console.log(err);
            } else {
              if (allCampgrounds.length < 1) {
                noMatch = "No campgrounds match that search, please try again.";
              }
              res.render("./campgrounds/index", {
                campgrounds: allCampgrounds,
                currentPage: pageNumber,
                pages: Math.ceil(count / perPage),
                page: "campgrounds",
                noMatch: noMatch,
                search: req.query.search, // "req.query.search" by existing is implicitly truthy
              });
            }
          }
        );
      });
  } else {
    // rendering "INDEX" page w/ pagination if NO SEARCH
    // Get all campgrounds from DB
    Campground.find({})
      .skip(perPage * pageNumber - perPage)
      .limit(perPage)
      .exec((err, allCampgrounds) => {
        Campground.countDocuments().exec((err, count) => {
          if (err || !allCampgrounds) {
            req.flash("error", "Well this is embarrassing, we failed to find some items... :/");
            res.redirect("/");
            console.log(err);
          } else {
            res.render("./campgrounds/index", {
              campgrounds: allCampgrounds,
              currentPage: pageNumber,
              pages: Math.ceil(count / perPage),
              page: "campgrounds",
              noMatch: noMatch,
              search: false,
            });
          }
        });
      });
  }
});

// CREATE - add new campground to DB
router.post("/", middleware.isLoggedIn, async (req, res) => {
  // get data from form and add to campgrounds array
  let name = req.body.name;
  let price = req.body.price;
  let img = req.body.image;
  let desc = req.body.description;
  let author = {
    id: req.user._id,
    username: req.user.username,
  };
  let newCampground = { name, price, image: img, author, description: desc };

  // Create a new campground with followers and save to DB
  try {
    let campground = await Campground.create(newCampground);
    let user = await User.findById(req.user._id).populate("followers").exec();
    let newNotification = {
      username: req.user.username,
      campgroundId: campground.id,
      campgroundName: campground.name,
      isCampgroundNotification: true,
    };
    for (const follower of user.followers) {
      let notification = await Notification.create(newNotification);
      follower.notifications.push(notification);
      follower.save();
    }
    //redirect back to campgrounds page
    req.flash("success", "Successfully created your campground!");
    res.redirect(`/campgrounds/${campground.id}`);
    // if (err) {
    //   req.flash("error", "Uhrmmm, we could not find that campground.");
    //   console.log(err);
    // } else {
    //   // Redirect back to campgrounds page
    //   req.flash("success", "Successfully created your campground!");
    //   res.redirect("/campgrounds");
    // }
  } catch (err) {
    console.log(err.message);
    req.flash(
      "error",
      "Well this is awkward. Something went wrong creating that campground & notifications for your followers."
    );
    res.redirect("back");
  }
});

// NEW - show form to create new campground
router.get("/new", middleware.isLoggedIn, (req, res) => {
  res.render("./campgrounds/new", { bgPhoto: middleware.pickRandomPhoto() });
});

// SHOW - shows additional info about one campground
//  this must be after '/campgrounds/new' otherwise it would treat /'campgrounds'/'new' as :id
router.get("/:id", (req, res) => {
  // find the campground with provided ID
  Campground.findById(req.params.id)
    .populate("comments")
    .exec((err, foundCampground) => {
      if (err || !foundCampground) {
        req.flash("error", "Well this is embarrassing, we failed to find some items... :/");
        res.redirect("back");
        console.log(err);
      } else {
        // render show template with the campground
        res.render("./campgrounds/show", { campground: foundCampground });
      }
    });
});

// EDIT CAMPGROUND ROUTE
router.get("/:id/edit", middleware.checkCampgroundOwnership, (req, res) => {
  Campground.findById(req.params.id, (err, foundCampground) => {
    if (err || !foundCampground) {
      req.flash("error", "Uhrmmm, we could not find that campground... <i class='fas fa-sad-cry'></i>");
      return res.redirect("/campgrounds/" + req.params.id);
    }
    res.render("campgrounds/edit", { campground: foundCampground });
  });
});

// UPDATE CAMPGROUND ROUTE
router.put("/:id", middleware.checkCampgroundOwnership, (req, res) => {
  // Find and update the correct campground
  Campground.findOneAndUpdate({ _id: req.params.id }, req.body.campground, (err, updatedCampground) => {
    if (err || !updatedCampground) {
      req.flash("error", "Uhrmmm, we could not find that campground.");
      res.redirect("back");
    } else {
      // Redirect somewhere -- typically to the SHOW page of that campground
      req.flash("success", "Campground page edited!");
      res.redirect("/campgrounds/" + req.params.id);
    }
  });
});

// DESTROY CAMPGROUND ROUTE
// NEWER SYNTAX FOR DESTROY CAMPGROUND (& associated comments) ROUTE
router.delete("/:id", middleware.checkCampgroundOwnership, async (req, res) => {
  try {
    let foundCampground = await Campground.findById(req.params.id);
    await foundCampground.remove();
    req.flash("success", "Campground deleted!");
    res.redirect("/campgrounds");
  } catch (error) {
    console.log(error.message);
    req.flash("error", "Uhrmmm, we could not find that campground for you to delete.");
    res.redirect("/campgrounds");
  }
});

module.exports = router;
