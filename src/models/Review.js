const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

// One review per user per book
reviewSchema.index({ book: 1, user: 1 }, { unique: true });

// Update book rating when review changes
reviewSchema.post('save', async function() {
  await this.constructor.updateBookRating(this.book);
});

reviewSchema.post('remove', async function() {
  await this.constructor.updateBookRating(this.book);
});

// Calculate and update book's average rating
reviewSchema.statics.updateBookRating = async function(bookId) {
  const stats = await this.aggregate([
    { $match: { book: bookId } },
    {
      $group: {
        _id: '$book',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    await mongoose.model('Book').findByIdAndUpdate(bookId, {
      averageRating: stats[0].averageRating,
      totalReviews: stats[0].totalReviews
    });
  } else {
    await mongoose.model('Book').findByIdAndUpdate(bookId, {
      averageRating: 0,
      totalReviews: 0
    });
  }
};

module.exports = mongoose.model('Review', reviewSchema); 