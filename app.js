const path = require("path");
const cookieParser=require("cookie-parser")
const express = require("express");
const morgan = require("morgan");
const cors=require("cors")
const compression=require("compression")
const tourRouter = require("./routes/tourRoutes");
const userRouter = require("./routes/userRoutes");
const reviewRouter = require("./routes/reviewRoutes");
const viewsRouter=require('./routes/viewsRoutes')
const bookingRouter=require('./routes/bookingRoutes')
const errorController = require("./controllers/errorController");
const app = express();
const AppError = require("./utils/appError");

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));
 

if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

app.use(compression())//for text compression
app.use((req, res, next) => {
  req.requestTime = new Date().toLocaleString();
  next();
});
app.use(cookieParser())
app.use(express.json());
app.use(cors())
app.use(express.static(path.join(__dirname, "public")));

app.use("/",viewsRouter)
app.use("/api/v1/users", userRouter);
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/bookings",bookingRouter)

app.all("*", (req, res, next) => {
  const err = new AppError(
    404,
    `Cant't Find ${req.originalUrl} on this server`
  );
  next(err);
});

app.use(errorController);

module.exports = app;
