const express = require("express");
const authController = require("../controllers/authController");
const bookingController = require("../controllers/bookingController");
const handlerFactory = require("../controllers/handlerFactory");
const router = express.Router();
const bookingModel = require("../model/bookingModel");

router
  .route("/checkout-session/:tourId")
  .get(authController.protect, bookingController.checkoutSession);

router.use(
  authController.protect,
  authController.restrictTo("admin", "lead-guide")
);

router
  .route("/")
  .get(handlerFactory.getAll(bookingModel))
  .post(handlerFactory.createOne(bookingModel));

router
  .route("/:id")
  .get(handlerFactory.getOne(bookingModel))
  .patch(handlerFactory.updateOne(bookingModel))
  .delete(handlerFactory.deleteOne(bookingModel));

module.exports = router;
