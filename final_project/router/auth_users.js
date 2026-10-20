const express = require('express');
const jwt = require('jsonwebtoken');
const books = require('./booksdb.js');
const regd_users = express.Router();

const users = [];
const JWT_SECRET = process.env.JWT_SECRET || 'fingerprint_customer';

const isValid = (username) =>
  users.some((user) => user.username === username);

const authenticatedUser = (username, password) =>
  users.some((user) => user.username === username && user.password === password);

// Only registered users can log in.
regd_users.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }
  if (!authenticatedUser(username, password)) {
    return res.status(401).json({ message: 'Invalid username or password.' });
  }

  const accessToken = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
  return res.status(200).json({ message: 'Login successful.', accessToken });
});

// Add or update the authenticated user's review for a book.
regd_users.put('/auth/review/:isbn', (req, res) => {
  const isbn = String(req.params.isbn);
  const book = books[isbn];
  if (!book) return res.status(404).json({ message: 'Book not found.' });

  const { review } = req.body || {};
  if (typeof review !== 'string' || !review.trim()) {
    return res.status(400).json({ message: 'Review text is required.' });
  }
  const username = req.user && req.user.username;
  if (!username) return res.status(401).json({ message: 'Authentication required.' });

  book.reviews = book.reviews || {};
  book.reviews[username] = review.trim();
  return res.status(200).json({
    message: 'Review added/updated successfully.',
    reviews: book.reviews
  });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
