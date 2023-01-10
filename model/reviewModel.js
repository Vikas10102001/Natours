const mongoose = require("mongoose");
const Tour = require("./tourModel");

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, "Review can not be empty"],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: "Tour",
      required: [true, "A review must belong to a tour"],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "A review must belong to a user"],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//this will ensure that the combo of tour and user is unique for a review means that user can only post one review on a particular tour
reviewSchema.index({tour:1 ,user:1},{unique:true})

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
    select: "name photo",
  });

  next();
});

//static method : we can call on a particular model  (Review.calculateAverageRatings)
reviewSchema.statics.calculateAverageRatings = async function (tourId) {
  //this is current model
  const stats = await this.aggregate([
    { $match: { tour: tourId } },
    {
      $group: {
        _id: "$tour",
        nRating: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);

  if (stats)
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
  // console.log(stats);
};

reviewSchema.post("save", function () {
  this.constructor.calculateAverageRatings(this.tour); //this.constructor is review model
  //we use this.constructor as Review is not defined here and we cannot define this middleware after defining the model
});

reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.findOne(); //will execute the query and store the result(review) in r property defined in this object
  next();
});

reviewSchema.post(/^findOneAnd/, function () {
  //we cannot use this.findOne() here in post because query is executed at this point
  this.r.constructor.calculateAverageRatings(this.r.tour);
});
const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
