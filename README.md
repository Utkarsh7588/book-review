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
- Redis
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
REDIS_HOST=localhost
REDIS_PORT=6379
# REDIS_PASSWORD=your_redis_password (if needed)
```

4. Make sure Redis is running locally or update the environment variables to point to your Redis server.

5. Start the server:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## Redis Usage

This project uses **Redis** for:

- **Caching**: GET requests for book listings, book details, and search results are cached for 5 minutes (300 seconds) to improve performance and reduce database load.
- **Rate Limiting**: All API routes are protected by a rate limiter that uses Redis to track requests per IP, helping to prevent abuse (default: 100 requests per 60 seconds).
- **Authentication Token Management**: JWT tokens are stored in Redis for validation and blacklisting. On logout, tokens are blacklisted in Redis to prevent reuse.

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

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>
```
- **Note:** JWT tokens are managed and blacklisted using Redis for secure authentication and logout.

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
- **Note:** This endpoint uses Redis caching for faster responses.

#### Get book by ID
```http
GET /api/books/:id?page=1&limit=10
```
- **Note:** This endpoint uses Redis caching for faster responses.

#### Search books
```http
GET /api/books/search?q=gatsby
```
- **Note:** This endpoint uses Redis caching for faster responses.

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
7. **Caching**: Redis is used to cache GET responses for books and search endpoints.
8. **Rate Limiting**: Redis is used to limit the number of requests per IP.

## Error Handling

The API uses consistent error responses:
```json
{
  "error": "Error message"
}
```

## Security

- Passwords are hashed using bcrypt
- JWT tokens expire after 24 hours and are managed/blacklisted in Redis
- Rate limiting is enforced using Redis
- Input validation using express-validator
- CORS enabled for API access
- Environment variables for sensitive data 