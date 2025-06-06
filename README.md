# Book Review API

A RESTful API for a Book Review system built with Node.js, Express, and MongoDB.

## Features

- User authentication with JWT
- Book management (create, list, search)
- Review system with ratings
- Pagination and filtering
- Search functionality

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd book-review-api
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/book-review-api
JWT_SECRET=your_jwt_secret_key
```

4. Start the server:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Documentation

### Authentication

#### Register a new user
```http
POST /api/auth/signup
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### Books

#### Create a new book (authenticated)
```http
POST /api/books
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "The Great Gatsby",
  "author": "F. Scott Fitzgerald",
  "genre": "Fiction",
  "description": "A story of the fabulously wealthy Jay Gatsby...",
  "publishedYear": 1925
}
```

#### Get all books
```http
GET /api/books?page=1&limit=10&author=Fitzgerald&genre=Fiction
```

#### Get book by ID
```http
GET /api/books/:id?page=1&limit=10
```

#### Search books
```http
GET /api/books/search?q=gatsby
```

### Reviews

#### Add a review (authenticated)
```http
POST /api/books/:id/reviews
Authorization: Bearer <token>
Content-Type: application/json

{
  "rating": 5,
  "comment": "Great book!"
}
```

#### Update a review (authenticated)
```http
PUT /api/reviews/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "rating": 4,
  "comment": "Updated review"
}
```

#### Delete a review (authenticated)
```http
DELETE /api/reviews/:id
Authorization: Bearer <token>
```

## Database Schema

### User
```javascript
{
  username: String,
  email: String,
  password: String (hashed),
  createdAt: Date,
  updatedAt: Date
}
```

### Book
```javascript
{
  title: String,
  author: String,
  genre: String,
  description: String,
  publishedYear: Number,
  averageRating: Number,
  totalReviews: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### Review
```javascript
{
  book: ObjectId (ref: Book),
  user: ObjectId (ref: User),
  rating: Number,
  comment: String,
  createdAt: Date,
  updatedAt: Date
}
```

## Design Decisions

1. **Authentication**: JWT is used for authentication as it's stateless and scalable.
2. **Database**: MongoDB is chosen for its flexibility with document-based storage.
3. **Pagination**: Implemented for both books and reviews to handle large datasets efficiently.
4. **Search**: Text index is created on book title and author for efficient searching.
5. **Reviews**: One review per user per book is enforced using a compound index.
6. **Rating System**: Average rating is automatically calculated and updated when reviews are added/modified/deleted.

## Error Handling

The API uses consistent error responses:
```json
{
  "error": "Error message"
}
```

## Security

- Passwords are hashed using bcrypt
- JWT tokens expire after 24 hours
- Input validation using express-validator
- CORS enabled for API access
- Environment variables for sensitive data 