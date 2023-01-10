const User = require("../model/userModel");
const multer = require("multer");
const sharp = require("sharp");
const catchAsync = require("../utils/catchAsync");
const handlerFactory = require("./handlerFactory");
const AppError = require("../utils/appError");

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "public/img/users");
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split("/")[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });

const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError(400, "Not an image ! Please upload an image"), false);
  }
};
const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

const filterObject = (obj, ...allowedFields) => {
  const filteredObject = {};
  for (key in obj) {
    if (obj[key] === "name" || "email") filteredObject[key] = obj[key];
  }
  // console.log(filteredObject);
  return filteredObject;
};

exports.uploadUserPhoto = upload.single("photo");
exports.resizeUserPhoto = (req, res, next) => {
  if (!req.file)  next()
  else{
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);
  next();
  }
};
exports.createUser = (req, res) => {
  res.status(404).json({
    status: "fail",
    message: "this route is not defined.Use /signup",
  });
};

exports.getAllUsers = handlerFactory.getAll(User);
exports.getUser = handlerFactory.getOne(User);
exports.deleteUser = handlerFactory.deleteOne(User);
//do not update pw
exports.updateUser = handlerFactory.updateOne(User);

exports.updateMe = catchAsync(async (req, res, next) => {
  // console.log(req.file);
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        400,
        "This route is not for password updates . Please use /updatePassword"
      )
    );
  }
  //update user data

  const updateObject = filterObject(req.body, "name", "email");
  if (req.file) 
  {
    updateObject.photo = req.file.filename;
  }
  // console.log(req.body,updateObject)
  const updatedUser = await User.findByIdAndUpdate(req.user.id, updateObject, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    status: "success",
    data: updatedUser,
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};
