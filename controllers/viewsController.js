const Booking = require("../model/bookingModel");
const Tour = require("../model/tourModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

exports.getOverview = catchAsync(async (req, res, next) => {
  //get tours from db
  const tours = await Tour.find();
  //Build Template
  //Render
  res.status(200).render("overview", {
    title: "All tours",
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  //get tours from db
  const tour = await Tour.findOne({ nameSlug: req.params.slug }).populate(
    "reviews"
  );
  //Build Template
  if (!tour) next(new AppError(400, "There is no tour with that name"));
  //Render
  else {
    res.status(200).render("tour", {
      title: tour.name + "Tour",
      tour,
    });
  }
});

exports.getLoginForm = async (req, res) => {
  res.status(200).render("login", {
    title: "Login",
  });
};
exports.getSignupForm = async (req, res) => {
  res.status(200).render("signup", {
    title: "Signup",
  });
};
exports.getAccount = catchAsync(async (req, res, next) => {
  res.status(200).render("account", {
    title: "Your account",
  });
});

exports.getMyTours = catchAsync(async (req, res, next) => {
  //Get all bookings for a particular user
  const bookings = await Booking.find({ user: req.user.id });

  const tourIds = bookings.map((el) => {
    return el.tour;
  });
  //Get tour using booking data
  const tours = await Tour.find({ _id: { $in: tourIds } });
  // console.log(tours)
  res.status(200).render("overview", {
    title: "My tours",
    tours,
  });
});
