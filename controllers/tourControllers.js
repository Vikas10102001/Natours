const Tour = require("../model/tourModel");
const AppError = require("../utils/appError");
// const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const handlerFactory = require("./handlerFactory");
//best tour query value
exports.bestTours = async (req, res, next) => {
  req.query.sort = "-ratingsAverage,-ratingsQuantity,price";
  req.query.fields =
    "name,duration,maxGroupSize,summary,price,difficulty,ratingsAverage";
  req.query.limit = 5;
  next();
};

exports.getAllTours = handlerFactory.getAll(Tour);
exports.createTour = handlerFactory.createOne(Tour);
exports.getTour = handlerFactory.getOne(Tour, { path: "Review" });
exports.deleteTour = handlerFactory.deleteOne(Tour);
exports.updateTour = handlerFactory.updateOne(Tour);

//function to get stats of tour whose ratings average is greater than 4.5
//aggegration function (test)
exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    { $match: { ratingsAverage: { $gte: 4.5 } } },
    {
      $group: {
        _id: "$difficulty",
        numTours: { $sum: 1 },
        avgRating: { $avg: "$ratingsAverage" },
        avgPrice: { $avg: "$price" },
        minPrice: { $min: "$price" },
        maxPRice: { $max: "$price" },
      },
    },
  ]);
  res.status(200).json({
    status: "success",
    requestedAT: req.requestTime,
    stats,
  });
});

//Controller to get monthly plans of a particular year
exports.getMonthlyPlans = catchAsync(async (req, res) => {
  let year = req.params.year * 1;
  const plans = await Tour.aggregate([
    { $unwind: "$startDates" },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: "$startDates" },
        numTourStarts: { $sum: 1 },
        tours: { $push: "$name" },
      },
    },
    {
      $addFields: {
        month: "$_id",
      },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: {
        numTourStarts: -1,
      },
    },
  ]);
  res.status(200).json({
    status: "success",
    requestedAT: req.requestTime,
    result: plans.length,
    plans,
  });
});

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(",");
  //converting distance to radians by dividing it by earth radius
  const radius = unit === "mi" ? distance / 3963.2 : distance / 6378.1;
  if (!lat || !lng) {
    next(
      new AppError(
        400,
        "Please provide latitude and longitude in format lat,lng"
      )
    );
  }
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });
  res.status(200).json({
    status: "success",
    result: tours.length,
    data: {
      tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(",");
  if (!lat || !lng) {
    next(
      new AppError(
        400,
        "Please provide latitude and longitude in format lat,lng"
      )
    );
  }

  const tours = await Tour.aggregate({
    $geoNear: {
      near: {
        type: "Point",
        coordinates: [lng * 1, lat * 1],
      },
      distanceField: "distance",
      distanceMultiplier: unit === mi ? 0.000621371 : 0.001,
    },
    $project: {
      name: 1,
      distance: 1,
    },
  });
  res.status(200).json({
    status: "success",
    result: tours.length,
    data: {
      tours,
    },
  });
});
