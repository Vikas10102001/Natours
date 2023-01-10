const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: "Tour",
      required: [true, "A Booking must belong to a tour"],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "A Booking must belong to a user"],
    },
    price:{
        //price might change in future
        type:Number,
        requied:[true,"A booking must have a price"]
    },
    paid: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
  
);

bookingSchema.pre(/^find/,function(){
  this.populate('user').populate({
    path:'tour',
    select:'name'
  })
})
const Booking=mongoose.model('booking',bookingSchema)
module.exports=Booking 