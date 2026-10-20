const express = require('express');
const books = require('./booksdb.js');
const { isValid, users } = require('./auth_users.js');

const publicUsers = express.Router();

// Helper: resolve a search asynchronously, matching the assignment's callback/promise
// requirement while keeping the provided booksdb.js as the source of book data.
const findBooks = (predicate) =>
  new Promise((resolve) => {
    resolve(Object.values(books).filter(predicate));
  });

// Register a new user.
publicUsers.post('/register', (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }
  if (isValid(username)) {
    return res.status(409).json({ message: 'Username already exists.' });
  }

  users.push({ username, password });
  return res.status(201).json({ message: 'User successfully registered.' });
});

// Retrieve all books.
publicUsers.get('/', async (req, res) => {
  try {
    const results = await findBooks(() => true);
    return res.status(200).json(results);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to retrieve books.' });
  }
});

// Retrieve a book by ISBN. This starter dataset uses numeric keys as ISBN identifiers.
publicUsers.get('/isbn/:isbn', async (req, res) => {
  try {
    const isbn = String(req.params.isbn);
    const book = books[isbn];
    if (!book) return res.status(404).json({ message: 'Book not found.' });
    return res.status(200).json(book);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to retrieve book.' });
  }
});

// Retrieve books by author (case-insensitive partial match).
publicUsers.get('/author/:author', async (req, res) => {
  try {
    const author = decodeURIComponent(req.params.author).toLowerCase();
    const results = await findBooks((book) => book.author.toLowerCase().includes(author));
    return res.status(200).json(results);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to search books by author.' });
  }
});

// Retrieve books by title (case-insensitive partial match).
publicUsers.get('/title/:title', async (req, res) => {
  try {
    const title = decodeURIComponent(req.params.title).toLowerCase();
    const results = await findBooks((book) => book.title.toLowerCase().includes(title));
    return res.status(200).json(results);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to search books by title.' });
  }
});

// Retrieve reviews for a specific book.
publicUsers.get('/review/:isbn', (req, res) => {
  const book = books[String(req.params.isbn)];
  if (!book) return res.status(404).json({ message: 'Book not found.' });
  return res.status(200).json(book.reviews || {});
});

module.exports.general = publicUsers;
