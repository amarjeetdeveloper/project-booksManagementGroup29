const mongoose = require("mongoose");
const bookModel = require("../models/BooksModel");
const userModel = require("../models/userModel");
const reviewModel = require("../models/reviewModel");
const aws= require("aws-sdk")

const isValid = function (value) {
  if (typeof value === "undefined" || value === null) return false;
  if (typeof value === "string" && value.trim().length === 0) return false;
  return true;
};

const isValidRequestBody = function (body) {
  return Object.keys(body).length > 0;
};


aws.config.update({
  accessKeyId: "AKIAY3L35MCRVFM24Q7U",
  secretAccessKeyId: "qGG1HE0qRixcW1T1Wg1bv+08tQrIkFVyDFqSft4J",
  region: "ap-south-1"
})

let uploadFile= async ( file) =>{
 return new Promise( function(resolve, reject) {
  // this function will upload file to aws and return the link
  let s3= new aws.S3({apiVersion: '2006-03-01'}); // we will be using the s3 service of aws

  var uploadParams= {
      ACL: "public-read",
      Bucket: "classroom-training-bucket",  //HERE
      Key: "xyz/" + file.originalname, //HERE 
      Body: file.buffer
  }
 

  s3.upload( uploadParams, function (err, data ){
      if(err) {
          return reject({"error": err})
      }
      console.log(data)
      console.log("file uploaded succesfully")
      return resolve(data.Location)
  })
})
}
const createBook = async function (req, res) {
  try {
    const data = req.body;

    if (Object.keys(data).length == 0)
      return res
        .status(400)
        .send({ status: false, message: "please provide data" });

    const { title, excerpt, ISBN, category, subcategory, releasedAt } = data;

    if (!title)
      return res
        .status(400)
        .send({ status: false, message: "please provide title" });
    const checkTitle = await bookModel.findOne({
      title: title,
      isDeleted: false,
    });
    if (checkTitle)
      return res
        .status(409)
        .send({ status: false, message: "book already exist with this title" });

    if (!excerpt)
      return res
        .status(400)
        .send({ status: false, message: "please provide excerpt" });

    if (!ISBN)
      return res
        .status(400)
        .send({ status: false, message: "please provide ISBN" });
    const ISBNregex = /^(?=(?:\D*\d){10}(?:(?:\D*\d){3})?$)[\d-]+$/;
    if (!ISBNregex.test(ISBN))
      return res
        .status(400)
        .send({ status: false, message: "please provide valid ISBN" });
    const checkISBN = await bookModel.findOne({
      ISBN: ISBN,
      isDeleted: false,
    });
    if (checkISBN)
      return res
        .status(409)
        .send({ status: false, message: "book alredy exist with this ISBN" });

    if (!category)
      return res
        .status(400)
        .send({ status: false, message: "please provide category" });
    if (!subcategory)
      return res
        .status(400)
        .send({ status: false, message: "please provide subcategory" });
    if (!releasedAt)
      return res
        .status(400)
        .send({ status: false, message: "please provide releasedAt" });
    const dateRegex = /^\d{4}\-(0?[1-9]|1[012])\-(0?[1-9]|[12][0-9]|3[01])$/;
    if (!dateRegex.test(releasedAt)) {
      return res.status(400).send({
        status: false,
        message: `Release date must be in "YYYY-MM-DD" format only And a "Valid Date"`,
      });
    }

    const saveData = await bookModel.create(data);
    return res.status(201).send({
      status: true,
      message: "Success",
      data: saveData,
    });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};

//get API for book with Query param//
const getBooks = async function (req, res) {
  try {
    const getQuery = req.query;
    let query = { isDeleted: false };

    if (isValidRequestBody(getQuery)) {
      const { userId, category, subcategory } = getQuery;

      if (isValid(userId) && mongoose.Types.ObjectId.isValid(userId)) {
        query.userId = userId;
      }
      if (isValid(category)) {
        query.category = category.trim();
      }

      if (isValid(subcategory)) {
        const subcategoryArr = subcategory
          .trim()
          .split(",")
          .map((x) => x.trim());
        query.subcategory = { $all: subcategoryArr }; //selects the documents where the value of a field is an array that contains all the specified elements
      }
    }
    const getBook = await bookModel.find(query).select({
      title: 1,
      excerpt: 1,
      userId: 1,
      category: 1,
      releasedAt: 1,
      reviews: 1,
    }).sort({title:1}); 
    if (getBook.length === 0) {
      return res.status(404).send({ status: false, message: "No books found" });
    }

    return res
      .status(200)
      .send({ status: true, message: "Books List", data: getBook });
  } catch (err) {
    res.status(500).send({ msg: err.message });
  }
};

//get API for book with Path param//
const getBookByPathParam = async function (req, res) {
  try {
    const bookId = req.params.bookId;

    if (bookId) {
      if (!mongoose.Types.ObjectId.isValid(bookId)) {
        return res
          .status(400)
          .send({ status: false, message: "Provide valid bookId" });
      }
    }

    const bookRequested = await bookModel.findOne({
      _id: bookId,
      isDeleted: false,
    });

    if (!bookRequested)
      return res
        .status(404)
        .send({ status: false, message: "no book with this id found" });

    const reviewsForBook = await reviewModel
      .find({ bookId: bookId, isDeleted: false })
      .select(["-createdAt", "-updatedAt", "-__v", "-isDeleted"]);

    const newdata = {
      ...bookRequested._doc,
      reviewData: reviewsForBook,
    };

    return res
      .status(200)
      .send({ status: true, message: "Success", data: newdata });
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};

const updateBook = async function (req, res) {
  try {
    const bookId = req.params.bookId;
    const body = req.body;
    const { title, excerpt, releaseDate, ISBN } = body;
    if (title) {
      const checkTitle = await bookModel.findOne({
        title: title,
        isDeleted: false,
      });
      if (checkTitle)
        return res.status(409).send({
          status: false,
          message: "Book with this Title already exists",
        });
    }
    if (ISBN) {
      const ISBNregex = /^(?=(?:\D*\d){10}(?:(?:\D*\d){3})?$)[\d-]+$/;
      if (!ISBNregex.test(ISBN))
        return res
          .status(400)
          .send({ status: false, message: "please provide valid ISBN" });
      const checkISBN = await bookModel.findOne({
        ISBN: ISBN,
        isDeleted: false,
      });
      if (checkISBN)
        return res.status(409).send({
          status: false,
          message: "Book with this ISBN already exists",
        });
    }

    const bookData = await bookModel.findOneAndUpdate(
      { _id: bookId, isDeleted: false },
      { title: title, excerpt: excerpt, releasedAt: releaseDate, ISBN: ISBN },
      { new: true }
    );

    res.status(200).send({ status: true, message: "Success", data: bookData });
  } catch (error) {
    res.status(500).send({ status: false, message: error.message });
  }
};

const delBook = async function (req, res) {
  try {
    const bookId = req.params.bookId;

    const findBook = await bookModel.findOneAndUpdate(
      { _id: bookId, isDeleted: false },
      { $set: { isDeleted: true, deletedAt: new Date() } }
    );

    return res.status(200).send({
      status: true,
      message: "Success",
      data: "This book is deleted now",
    });
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};

module.exports.createBook = createBook;
module.exports.getBooks = getBooks;
module.exports.getBookByPathParam = getBookByPathParam;
module.exports.updateBook = updateBook;
module.exports.delBook = delBook;
