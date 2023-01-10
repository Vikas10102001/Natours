const mongoose = require("mongoose");
const validator = require("validator");
const bcrpyt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please give your name"],
  },
  email: {
    type: String,
    required: [true, "Please give your email"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please enter a valid email"],
  },
  photo:{type: String,
  default:'default.jpg'
  },
  role: {
    type: String,
    enum: ["user", "guide", "lead-guide", "admin"],
    default: "user",
  },
  active: {
    type: Boolean,
    default: true,
  },
  password: {
    type: String,
    required: [true, "Please give your password"],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm your password"],
    validate: {
      validator: function (ele) {
        return ele === this.password;
      },
      message: "Passwords are not same",
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
});

userSchema.pre("save", async function (next) {
  //check wether password is modified/newly created
  if (!this.isModified("password")) return next();

  //hash the password
  this.password = await bcrpyt.hash(this.password, 12);

  //removing passwordConfirm
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();
  //the token might be created before the document is saved or we can say before the passwordChangedAt is saved so we subtract 1 sec
  this.passwordChangedAt = new Date(Date.now() - 1000);
  next();
});

userSchema.pre(/^find/, function (next) {
  //Selecting all the active
  this.find({ active: true });
  next();
});
//instance method:will be present on all documents of a certain collection
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  //this.password is not selected and is not available so we need to pass userpassword
  //compare will convert the candidate password to hash and will compare with user password which is already hashed
  return await bcrpyt.compare(candidatePassword, userPassword);
};

userSchema.methods.changePasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    //converting it to JWTTimestamp format which is in second
    const changedPwTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000
    );

    return changedPwTimestamp > JWTTimestamp;
  }
  //password not changed
  return false;
};

userSchema.methods.createPWResetToken = function () {
  //creating token
  const resetToken = crypto.randomBytes(32).toString("hex");

  //encrypting token
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
