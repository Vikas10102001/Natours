const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/appError");
const apiFeatures = require("../utils/apiFeatures");

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    let doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) return next(new ApiError(404, "No document found with that id"));
    res.status(204).json({
      status: "success",
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    let updatedData = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedData)
      return next(new ApiError(404, "No tour found with that id"));
    res.status(200).json({
      status: "success",
      requestedAT: req.requestTime,
      data: updatedData,
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const newData = await Model.create(req.body);
    res.status(201).json({
      status: "success",
      requestedAT: req.requestedTime,
      newData,
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);

    const data = await query;
    if (!data) return next(new ApiError(404, "No tour found with that id"));
    res.status(200).json({
      status: "success",
      requestedAT: req.requestTime,
      data,
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    //to allow nested GET review on tours
    let filter = {};
    if (req.params.tourId) filter.tour = req.params.tourId;

    const features = new apiFeatures(Model.find(), req.query)
      .filter()
      .sort()
      .fields()
      .pagination();

    const data = await features.query.find(filter);
    res.status(200).json({
      status: "success",
      requestedAt: req.requestTime,
      results: data.length,
      data,
    });
  });
