const express = require("express");
const tourController = require("../controllers/tourControllers");
const authController = require("../controllers/authController");
const reviewRoutes = require("./reviewRoutes");
const router = express.Router();

router.use("/:tourId/reviews", reviewRoutes);
router.route("/get-tour-stats").get(tourController.getTourStats);
router.route("/tours-within/:distance/center/:latlng/unit/:unit").get(tourController.getToursWithin)
router.route("/get-distances/:latlng/unit/:unit").get(tourController.getDistances)
router
  .route("/get-monthly-plans/:year")
  .get(
    authController.protect,
    authController.restrictTo("admin", "lead-guide", "guide"),
    tourController.getMonthlyPlans
  );
router
  .route("/5-best-tours")
  .get(tourController.bestTours, tourController.getAllTours);
router
  .route("/")
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tourController.createTour
  );

router
  .route("/:id")
  .get(tourController.getTour)
  .delete(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tourController.deleteTour
  )
  .patch(tourController.updateTour);
module.exports = router;
