const express = require("express");
const userRoute = express.Router();
const User = require("../models/User");
const Joi = require("joi");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const verifyToken = require("../middleware/verifyToken");
const upload = require("../middleware/upload-image");

const userSchema = Joi.object({
  fullName: Joi.string().min(3).max(100).required(),
  userName: Joi.string().alphanum().min(3).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(3).max(50).required(),
  userType: Joi.string().min(3).max(20).required(),
});

userRoute.get("/", (req, res) => {
  res.send("we are at user route with get request...");
});
userRoute.get("/user-dashboard", verifyToken, (req, res) => {
  res.send("Accessed user dashboard route and user token verified...");
});

// publishride route with post request
userRoute.post("/register", async (req, res) => {
  const validationMsg = userSchema.validate(req.body);

  if (validationMsg.error) {
    res.send(validationMsg.error.details[0].message);
  } else {
    const alreadyUser = await User.findOne({ email: req.body.email });
    if (alreadyUser) {
      res.send("User has already Register...");
    } else {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(req.body.password, salt);

      // insert into DB!!!
      const userRegResponse = await User.create({
        fullName: req.body.fullName,
        userName: req.body.userName,
        email: req.body.email,
        password: hash,
        userType: req.body.userType,
      });
      res.send(userRegResponse.fullName + " has successfully register");
    }
  }
});
userRoute.post("/login", async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const user = await User.findOne({ email: email });
  if (!user) {
    res.send("User not found...");
  } else {
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      res.send("Invalid Password...");
    } else {
      // create token if user is valid
      const token = jwt.sign(
        { _id: user._id, iat: Date.now() },
        process.env.SECRET
      );
      // res.send("Login Successfull !!!");
      res.send({ token: token, user: user });
    }
  }
});

userRoute.post("/upload", upload.single("image"), async (req, res) => {
  res.send("Image uploaded...");
});

// const multer = require("multer");
// const upload = multer();
// const fs = require("fs");
// const { promisify } = require("util");
// const { nextTick } = require("process");
// const pipline = promisify(require("stream").pipeline);

// userRoute.post("/upload", upload.single("file"), async (req, res) => {
//   const { file } = req;
//   const filename = file.originalname;
//   if (file.detectedFileExtention != "jpg")
//     console.log("Only jpg files are allowed");
//   await pipline(
//     file.stream,
//     fs.createWriteStream(`${__dirname}/../public/uploads/${filename}`)
//   );

//   res.send("File uploaded as " + filename);
// });

userRoute.patch("/:id", async (req, res) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(req.body.password, salt);
    const updatedUser = await User.updateOne(
      { _id: req.params.id },
      {
        $set: {
          fullName: req.body.fullName,
          userName: req.body.userName,
          email: req.body.email,
          password: hash,
          userType: req.body.userType,
        },
      }
    );
    res.send(`${req.body.fullName} has successfully updated...`);
  } catch (err) {
    res.send(err);
  }
});
userRoute.delete("/", (req, res) => {
  res.send("we are at user route with delete request...");
});

module.exports = userRoute;
