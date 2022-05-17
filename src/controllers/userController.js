const userModel = require("../models/userModel");
const jwt = require("jsonwebtoken");

const isValid = function (value) {
    if (typeof value === "undefined" || value === null) return false;
    if (typeof value === "string" && value.trim().length === 0) return false;
    return true;
  };

const isValidTitle = function (title) {
    return ["Mr", "Miss", "Mrs"].indexOf(title) !== -1;
  };

const createUser = async function (req, res) {
  try {
    const data = req.body;
    const { title, name, phone, email, password } = data; // destructuring of data object

    // Checking if title is sent through body or not//
    
    if (!title) {
      return res
        .status(400)
        .send({ status: false, message: "Please provide title" });
    }

    // Checking if title is sent through body or not//
    
    if (!isValidTitle(title)) {
      return res
        .status(400)
        .send({ status: false, message: "Please provide right title" });
    }

    // Checking if name is sent through body or not//
    if (!name) {
      return res
        .status(400)
        .send({ status: false, message: "Please provide name" });
    }

    // Checking if name is correct name or not i.e. no digit allowed//
 if (/\d/.test(name)) {
      return res
        .status(400)
        .send({ status: false, message: "Please enter correct name." });
    }

    // Checking if phone is sent through body or not//
    if (!phone) {
      return res
        .status(400)
        .send({ status: false, message: "Please provide phone" });
    }
    
    if (!/^[6-9]\d{9}$/.test(phone)) {
      return res
        .status(400)
        .send({ status: false, message: "Please enter correct phone Number." });
    }

    // Checking if user with this phone number already exist in database//
    const duplicatephone = await userModel.findOne({
      phone: phone,
      isDeleted: false,
    });
    if (duplicatephone) {
      return res
        .status(409)
        .send({ status: false, message: "User with this phone already exist" });
    }

    // Checking if email is sent through body or not//
    if (!email) {
      return res
        .status(400)
        .send({ status: false, message: "Please provide email" });
    }

    // Checking if email is valid or not //
    if (!/^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/.test(email)) {
      return res
        .status(400)
        .send({ status: false, message: "Please enter correct email." });
    }

    // Checking if user with this email already exist in database//
    const duplicateEmail = await userModel.findOne({
      email: email,
      isDeleted: false,
    });
    if (duplicateEmail) {
      return res
        .status(409)
        .send({ status: false, message: "User with this email already exist" });
    }

    // Checking if password is sent through body or not//
    if (!password) {
      return res
        .status(400)
        .send({ status: false, message: "Please provide password" });
    }



    // checking password with regex //
    if (!/^([a-zA-Z0-9!@#$%^&*_\-+=><]{8,15})$/.test(password)) { return res.status(400).send({ status: false, message: "Please provide a valid password between 8 to 15 character length." }) }
    
  
    // creation of new document in db//
    const userCreated = await userModel.create(data);
    res.status(201).send({
      status: true,
      message: "Success",
      data: userCreated,
    });
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};

const loginUser = async function (req, res) {
  try {
    const data = req.body;
    const { email, password } = data;

    // Checking if email is sent through body or not//
    if (!email)
      return res
        .status(400)
        .send({ status: false, message: "email is missing" });

    // Checking if email is valid or not //
    if (!/^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/.test(email)) {
      return res
        .status(400)
        .send({ status: false, message: "Please enter correct email." });
    }

    // Checking if password is sent through body or not//
    if (!password)
      return res
        .status(400)
        .send({ status: false, message: "password is missing" });

        
    // checking password with regex //
    if (!/^([a-zA-Z0-9!@#$%^&*_\-+=><]{8,15})$/.test(password)) { 
      return res.status(400).send({ status: false, message: "Please provide a valid password between 8 to 15 character length." }) 
    }
    
    //finding a user in db with above credentials//
    const findUser = await userModel.findOne({
      email: email,
      password: password,
      isDeleted: false,
    });

    if (!findUser)
      return res
        .status(404)
        .send({ Status: false, message: " user does not exists" });

    const token = jwt.sign(
      { userId:findUser._id.toString() },
      "Books Management",
      { expiresIn: "1d" }
    );
 
    return res
      .status(201)
      .send({ Status: true, message: "Success", data: token });
  }
   catch (error) {
    res.status(500).send({ status: false, message: error.message });
  }
};

module.exports.loginUser = loginUser;
module.exports.createUser = createUser;
