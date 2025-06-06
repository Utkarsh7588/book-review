const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Review = require('../models/Review');
const auth = require('../middleware/auth');

// Update a review (authenticated)
router.put('/:id', auth, [
  body('rating').isInt({ min: 1, max: 5 }),
  body('comment').trim().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Check if the user owns the review
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this review' });
    }

    review.rating = req.body.rating;
    review.comment = req.body.comment;
    await review.save();

    res.json(review);
  } catch (error) {
    res.status(500).json({ error: 'Error updating review' });
  }
});

// Delete a review (authenticated)
router.delete('/:id', auth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Check if the user owns the review
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this review' });
    }

    await review.remove();
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting review' });
  }
});

module.exports = router; 