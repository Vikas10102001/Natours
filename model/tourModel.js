const Mongoose = require("mongoose");
const slugify = require("slugify");
const User = require("./userModel");
//tour schema
const tourSchema = new Mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A tour must have a name"],
      unique: true,
      trim: true,
      maxLength: [50, "A tour must not have more than 50 letters"],
      minLenght: [10, "A tour must have  10 letters"],
    },
    nameSlug: String,
    secretTour: Boolean,
    duration: {
      type: Number,
      required: [true, "A tour must have a duration"],
      min: [1, "A duration  must be greater than 0"],
    },
    maxGroupSize: {
      type: Number,
      required: [true, "A tour must have a max group size"],
      min: [1, "A group size must be greater than 0"],
    },
    difficulty: {
      type: String,
      required: [true, "A tour must have a difficulty"],
      enums: {
        values: ["easy", "medium", "difficult"],
        message: "difficulty should be easy medium or difficult",
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min:[1,'Rating must be above zero'],
      max:[5,'Rating must not be greater than 5'],
      set:val=>Math.round(val*10)/10
    },
    ratingsQuantity: {
      type: Number,
      deafult: 0,
    },
    price: {
      type: Number,
      required: [true, "A tour must have a price"],
    },
    priceDiscount: {
      type: Number,
      //custom validator
      validate: {
        validator: function (val) {
          return val < this.price; //priceDiscount must be smaller than price
        },
        message: "price discount must be smaller than price",
      },
    },
    summary: {
      type: String,
      trim: true,
      unique: true,
      required: [true, "A tour must have a summary"],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, "A tour must have a image cover"],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    startLocation: {
      //GeoJSON
      type: {
        type: String,
        default: "Point",
        enum: ["Point"],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: "Point",
          enum: ["Point"],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides:[
      {
        type:Mongoose.Schema.ObjectId,
        ref:'User'
      }
    ],
  },
  {
    toJSON: { virtuals: true }, //options for virtual fields
    toObject: { virtuals: true },
  }
);

//creating indexes
tourSchema.index({price:1,ratingsAverage:-1})
tourSchema.index({slug:1})
//for geoSpatial query to work we need to add this index  
tourSchema.index({startLocation:'2dsphere'})

//creating virtual fields
tourSchema.virtual("durationWeeks").get(function () {
  return this.duration / 7;
});

//virtual populate
tourSchema.virtual('reviews',{
  ref:'Review',
  foreignField:'tour',
  localField:'_id'
})

//DOCUMENT MIDDLEWARE : for creating slug of tour name
tourSchema.pre("save", function (next) {
  this.nameSlug = slugify(this.name, {
    lower: true,
  });
  next();
});

// tourSchema.pre("save", async function (next) {
//   guidesPromises = this.guides.map(async (ele) => await User.findById(ele));
//   this.guides = await Promise.all(guidesPromises);
//   console.log(this.guides)
//   next();
// });
//post middleware runs after every pre middleware in executed and have access to currently processed document
// tourSchema.post("save", function (doc, next) {
//   console.log(doc);
//   next();
// });

//QUERY MIDDLEWARE:runs after or before a query is executed
//will add query and find the doc which are not secret
//using reg exp ,it works for every query starting with find
tourSchema.pre(/^find/, function (next) { 
  this.find({ secretTour: { $ne: true } });
  this.time = Date.now();
  next();
});

tourSchema.pre(/^find/,function(next){
  this.populate({
    path:'guides',
    select:'-__v -passwordChangedAt' 
  })
  next()
})
tourSchema.post(/^find/, function (doc, next) {
  console.log(`Query took ${Date.now() - this.time} ms to execute`);
  next();
});

//AGGREGATION MIDDLEWARE
// tourSchema.pre("aggregate", function (next) {
//   this.pipeline().unshift({ $match: { secretTours: { $ne: true } } });
//   //will add this stage to aggregation pipeline
//   next();
// });
//creating tour model using above schema
const Tour = Mongoose.model("Tour", tourSchema);

module.exports = Tour;
