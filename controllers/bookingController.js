const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Booking = require("../model/bookingModel");
const Tour = require("../model/tourModel");
const catchAsync = require("../utils/catchAsync");

exports.checkoutSession = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.tourId);
  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price_data: {
          unit_amount: tour.price * 100,
          currency: "inr",
          product_data: {
            name: `${tour.name} tour`,
            description: tour.summary,
            images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
          },
        },
        quantity: 1,
      },
    ],
    client_reference_id: req.params.tourId,
    customer_email: req.user.email,
    mode: "payment",
    payment_method_types: ["card"],
    success_url: `${req.protocol}://${req.get("host")}?tour=${
      req.params.tourId
    }&price=${tour.price}&user=${req.user.id}`,
    cancel_url: `${req.protocol}://${req.get("host")}/${tour.id}/overview`,
  });

  //   console.log(session);
  res.status(200).json({
    status: "success",
    session,
  });
});

exports.createBooking = catchAsync(async (req, res, next) => {
  const { tour, user, price } = req.query;
  if (!tour & !user & !price) return next();
  await Booking.create({ tour, user, price });
  res.redirect(req.originalUrl.split("?")[0]);
});

