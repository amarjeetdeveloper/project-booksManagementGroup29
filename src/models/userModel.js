const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: "title required",
      enum: ["Mr", "Mrs", "Miss"],
    },
    name: { type: String, required: "name is required", trim: true },
    phone: { type: String, required: "phone is required", unique: true },
    email: {
      type: String,
      required: "email is required",
      unique: true,
      trim:true,
      lowercase:true,
    },
    password: {
      type: String,
      required: "password is required",
    },
    address: {
      street: String ,
      city: String ,
      pincode: String ,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
