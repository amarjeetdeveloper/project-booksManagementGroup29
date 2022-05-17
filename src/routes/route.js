const express = require('express');
const router = express.Router();

///////////////// [ IMPORTED CONTROLLERS ] /////////////////
const userController= require("../controllers/userController");
const bookController = require("../controllers/bookController")
const reviewController = require("../controllers/reviewController")
const middleware = require ("../middleware/auth")

///////////////// [ ALL API's HERE ] /////////////////
router.post('/register',userController.createUser)
router.post('/login',userController.loginUser)

router.post('/books',middleware.authenticUser,middleware.authorizedUser,bookController.createBook)
router.get ('/books',middleware.authenticUser,bookController.getBooks)
router.get ('/books/:bookId',middleware.authenticUser,bookController.getBookByPathParam)
router.put('/books/:bookId',middleware.authenticUser,middleware.authorizedUser,bookController.updateBook)
router.delete("/books/:bookId",middleware.authenticUser,middleware.authorizedUser,bookController.delBook)

router.post("/books/:bookId/review",reviewController.createReview)
router.put('/books/:bookId/review/:reviewId',reviewController.updateReview)
router.delete("/books/:bookId/review/:reviewId",reviewController.deleteReviews)

///////////////// [ EXPRORTED ROUTHER ] /////////////////
module.exports = router;
