const catchAsync = require("../utils/catchAsync");
const User = require("../model/userModel");
const jwt = require("jsonwebtoken");
const AppError = require("../utils/appError");
const sendEmail = require("../utils/email");
const { promisify } = require("util");
const crypto = require("crypto");
const Email = require("../utils/email");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expiresIn: Date.now() + process.env.COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    httpOnly: true, //this will ensure that cookie is not accessed or modified by the browser
  };

  //using secure=true cookie is only sent in secure connection i.e https
  if (process.env.NODE_DEV === "production") cookieOptions.secure = true;
  user.password = undefined;
  res.cookie("jwt", token, cookieOptions);

  res.status(statusCode).json({
    status: "success",
    token,
    data: user,
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });
  
  const url=`${req.protocol}://${req.get('host')}/account`
  await new Email({
    name: req.body.name,
    email: req.body.email,
  },url).sendWelcome()
  //creating jwt token
  createToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password)
    return next(new AppError(400, "Please provide email and password"));

  //if users is not present or password is incorrect
  const user = await User.findOne({ email }).select("+password");
  // console.log(await user.correctPassword(password, user.password))
  if (!user || !(await user.correctPassword(password, user.password)))
    return next(new AppError(401, "Incorrect email or password"));

  //sending jwt if users and pw are valid
  createToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  //getting token and checking if its there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token)
    return next(
      new AppError(401, "You are not logged in !Please login to get access")
    );

  //verification of token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //checking if user still exists
  //means if user is removed after the token was issued
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(401, "The user belonging to this token does not exist")
    );
  }

  //Check if user changed the password after the token was issued
  if (currentUser.changePasswordAfter(decoded.iat)) {
    return next(
      new AppError(401, "User recently changed password. Please log in again!!")
    );
  }
  res.locals.user = currentUser;
  req.user = currentUser;
  next();
});

//middleware for rendering purpose ...no error is formed
exports.isLoggedIn = async (req, res, next) => {
  try {
    //getting token and checking if its there
    if (req.cookies.jwt) {
      //verification of token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      //checking if user still exists
      //means if user is removed after the token was issued
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      //Check if user changed the password after the token was issued
      if (currentUser.changePasswordAfter(decoded.iat)) {
        console.log(decoded)
        return next();
      }
      res.locals.user = currentUser;
      return next();
    }
  } catch (err) {
    return next();
  }

  next();
};

exports.logout = (req, res) => {
  res.cookie("jwt", "logged out", {
    expiresIn: new Date(Date.now + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({
    status: "success",
  });
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(403, "You do not have permission to perform this action !")
      );
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //Check if user exists
  const user = await User.findOne({ email: req.body.email });
  if (!user) return next(new AppError(404, "No user with this email address"));
  //Create token for password reset
  const resetToken = user.createPWResetToken();
  await user.save({ validateBeforeSave: false });
  //Send the token
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a patch request with the new password and passwordConfirm to:${resetURL}\n if you didn't forget your password Please ignore this message`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset token (valid for 10 min)",
      message,
    });

    res.status(200).json({
      status: "success",
      message: "token sent to email",
    });
  } catch (er) {
    this.passwordResetToken = undefined;
    this.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    next(
      new AppError(
        500,
        "There was an error sending the email ! Try again later"
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //get user based on token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gte: Date.now() },
  });

  if (!user) {
    return next(new AppError(400, "Token is invalid or has expired"));
  }

  //save new password if token is not expired
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetExpires = undefined;
  user.passwordResetToken = undefined;
  await user.save();
  //set the passwordChangedAt property (document middleware)
  //send the new token
  createToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id).select("+password");
  // console.log(req.body.currentPassword)
  const correct = await user.correctPassword(
    req.body.currentPassword,
    user.password
  );
  if (!correct) {
    return next(
      new AppError(
        401,
        "Current password is not correct ! Enter correct password"
      )
    );
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  createToken(user, 201, res);
});
