const AppError = require("../utils/appError");

const sendErrorDev = (err, req, res) => {
  if (req.originalUrl.startsWith("/api")) {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } else {
    res.status(err.statusCode).render("error", {
      title: "error",
      msg: err.message,
    });
  }
};

const sendErrorProd = (err, req, res) => {
  if (req.originalUrl.startsWith("/api")) {
    if (!err.isOperational) {
      err.message = "Something Went Wrong";
      err.statusCode = 500;
      err.status = "error";
    }
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    if (!err.isOperational) {
      err.message = "Please try again";
      err.statusCode = 500;
    }

    return res.status(err.statusCode).render("error",{
      title: "error",
      msg: err.message,
    });
  }
};
// const handleCastError=(err)=>{
//     const message=`Invalid ${err.path}:${err.value}`
//     return new AppError(400,message)
// }
// const handleDuplicateField=(err)=>{
//     const str='';
//      for (const key in err.keyValue)
//      {
//        str+=`${err.keyValue}`
//     }

// }

const handleJwtError = () =>
  new AppError(401, "Invalid Token ! Please login again");

const handleJwtExpiredError = () =>
  new AppError(401, "Token Expired ! Please login again");

const errorController = (err, req, res, next) => {
  console.log(err.stack);

  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") sendErrorDev(err, req, res);
  else {
    let error = { ...err };
    error.message = err.message;
    // if (error.name === "Cast Error") error = handleCastError(error);
    // if (error.code === 11000) error = handleDuplicateField(error);
    // if (error.name === "Validation Error") error = handleValidationError(error);
    if (error.name === "JsonWebTokenError") error = handleJwtError();
    if (error.name === "TokenExpiredError") error = handleJwtExpiredError();
    sendErrorProd(error, req, res);
  }
};

module.exports = errorController;
