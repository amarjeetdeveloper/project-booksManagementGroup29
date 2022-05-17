const mongoose = require("mongoose");
const bookModel = require("../models/BooksModel");
const userModel = require("../models/userModel");
const reviewModel = require("../models/reviewModel");

const createBook = async function (req, res) {
  try {
    const data = req.body;

    const { title, excerpt, ISBN, category, subcategory, releasedAt } =
      data;

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
const getBook = async function (req, res) {
  try {
    const queryDetails = req.query;

    if (Object.keys(queryDetails).length == 0) {
      const bookFetched = await bookModel
        .find({ isDeleted: false })
        .select([
          "-ISBN",
          "-subcategory",
          "-isDeleted",
          "-createdAt",
          "-updatedAt",
          "-__v",
        ])
        .sort({ title: 1 });

      if (bookFetched.length == 0) {
        return res
          .status(404)
          .send({ status: false, message: "No book found" });
      }

      return res
        .status(200)
        .send({ status: true, message: "Book List", data: bookFetched });
    }

    //Adding new key in queryDetails object//
    queryDetails.isDeleted = false;

    //// check validaion of userId///////////
    const userId = queryDetails.userId;
    if (userId) {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res
          .status(400)
          .send({ status: false, message: "Provide valid userId" });
      }
    }

    //finding books which satisfies the given queries//
    const specificBooks = await bookModel
      .find(queryDetails)
      .select([
        "-ISBN",
        "-subcategory",
        "-isDeleted",
        "-createdAt",
        "-updatedAt",
        "-__v",
      ])
      .sort({ title: 1 });

    if (specificBooks.length == 0)
      return res
        .status(404)
        .send({ status: false, message: "No books found with given queries" });

    return res
      .status(200)
      .send({ status: true, message: "Book List", data: specificBooks });
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
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

    const bookRequested = await bookModel.findOne({_id:bookId,isDeleted:false});

    if (!bookRequested)
      return res
        .status(404)
        .send({ status: false, message: "no book with this id found" });

    const reviewsForBook = await reviewModel.find({ bookId: bookId, isDeleted:false }).select(["-createdAt", "-updatedAt", "-__v", "-isDeleted"]);

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
        return res
          .status(409)
          .send({
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
        return res
          .status(409)
          .send({
            status: false,
            message: "Book with this ISBN already exists",
          });
    }

    const bookData = await bookModel.findOneAndUpdate(
      { _id: bookId, isDeleted: false },
      { title: title, excerpt: excerpt, releasedAt: releaseDate, ISBN: ISBN },
      { new: true }
    );

    res
      .status(201)
      .send({ status: true, message: "Success", data: bookData });
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
module.exports.getBook = getBook;
module.exports.getBookByPathParam = getBookByPathParam;
module.exports.updateBook = updateBook;
module.exports.delBook = delBook;
