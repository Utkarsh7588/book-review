const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Book = require('../models/Book');
const Review = require('../models/Review');
const auth = require('../middleware/auth');

// Input validation rules
const validateBook = [
  body('title').trim().notEmpty(),
  body('author').trim().notEmpty(),
  body('genre').trim().notEmpty(),
  body('description').trim().notEmpty(),
  body('publishedYear').isInt({ min: 1000, max: new Date().getFullYear() })
];

// Add a new book
router.post('/', auth, validateBook, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const book = new Book(req.body);
    await book.save();
    res.status(201).json(book);
  } catch (error) {
    res.status(500).json({ error: 'Error creating book' });
  }
});

// Get books with filters
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.author) query.author = new RegExp(req.query.author, 'i');
    if (req.query.genre) query.genre = new RegExp(req.query.genre, 'i');

    const books = await Book.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Book.countDocuments(query);

    res.json({
      books,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalBooks: total
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching books' });
  }
});

// Search for books
router.get('/search', auth, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // Try exact match first
    let books = await Book.find(
      { $text: { $search: q } },
      { score: { $meta: 'textScore' } }
    )
    .sort({ score: { $meta: 'textScore' } })
    .limit(10);

    // Fallback to partial match if no exact matches
    if (books.length === 0) {
      books = await Book.find({
        $or: [
          { title: { $regex: q, $options: 'i' } },
          { author: { $regex: q, $options: 'i' } }
        ]
      }).limit(10);
    }

    res.json(books);
  } catch (error) {
    res.status(500).json({ error: 'Error searching books' });
  }
});

// Get a single book with its reviews
router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ book: req.params.id })
      .populate('user', 'username')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalReviews = await Review.countDocuments({ book: req.params.id });

    res.json({
      book,
      reviews,
      currentPage: page,
      totalPages: Math.ceil(totalReviews / limit),
      totalReviews
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching book details' });
  }
});

// Add a review
router.post('/:id/reviews', auth, [
  body('rating').isInt({ min: 1, max: 5 }),
  body('comment').trim().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    // Check for existing review
    const existingReview = await Review.findOne({
      book: req.params.id,
      user: req.user._id
    });

    if (existingReview) {
      return res.status(400).json({ error: 'You have already reviewed this book' });
    }

    const review = new Review({
      ...req.body,
      book: req.params.id,
      user: req.user._id
    });

    await review.save();
    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ error: 'Error adding review' });
  }
});

module.exports = router; 