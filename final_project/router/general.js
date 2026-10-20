const express = require('express');
const axios = require('axios');
const books = require('./booksdb.js');
const { isValid, users } = require('./auth_users.js');

const publicUsers = express.Router();

// Base URL for requests to this application's own book routes.
// Axios HTTP requests still return the local assignment dataset.
const getLocalBaseUrl = (req) => `${req.protocol}://127.0.0.1:${process.env.PORT || 5000}`;

// Register a new user.
publicUsers.post('/register', (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({
      message: 'Username and password are required.'
    });
  }

  if (isValid(username)) {
    return res.status(409).json({
      message: 'Username already exists.'
    });
  }

  users.push({ username, password });
  return res.status(201).json({
    message: 'User successfully registered.'
  });
});

// Retrieve all books.
publicUsers.get('/', async (req, res) => {
  try {
    const response = await axios.get(`${getLocalBaseUrl(req)}/internal/books`);
    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to retrieve books.' });
  }
});

// Internal local-data endpoint used by Axios lookups.
publicUsers.get('/internal/books', (req, res) => {
  return res.status(200).json(Object.values(books));
});

// Retrieve a book by ISBN using Axios.
publicUsers.get('/isbn/:isbn', async (req, res) => {
  try {
    const isbn = String(req.params.isbn);
    const response = await axios.get(
      `${getLocalBaseUrl(req)}/internal/books/${encodeURIComponent(isbn)}`
    );
    return res.status(200).json(response.data);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return res.status(404).json({ message: 'Book not found.' });
    }
    return res.status(500).json({ message: 'Unable to retrieve book.' });
  }
});

// Internal local-data endpoint for a single book.
publicUsers.get('/internal/books/:isbn', (req, res) => {
  const book = books[String(req.params.isbn)];
  if (!book) {
    return res.status(404).json({ message: 'Book not found.' });
  }
  return res.status(200).json(book);
});

// Retrieve books by author using an Axios HTTP request.
publicUsers.get('/author/:author', async (req, res) => {
  try {
    const author = decodeURIComponent(req.params.author);
    const response = await axios.get(
      `${getLocalBaseUrl(req)}/internal/search/author/${encodeURIComponent(author)}`
    );
    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to search books by author.' });
  }
});

// Internal local-data endpoint for author search.
publicUsers.get('/internal/search/author/:author', (req, res) => {
  const author = decodeURIComponent(req.params.author).toLowerCase();
  const results = Object.values(books).filter((book) =>
    String(book.author || '').toLowerCase().includes(author)
  );
  return res.status(200).json(results);
});

// Retrieve books by title using an Axios HTTP request.
publicUsers.get('/title/:title', async (req, res) => {
  try {
    const title = decodeURIComponent(req.params.title);
    const response = await axios.get(
      `${getLocalBaseUrl(req)}/internal/search/title/${encodeURIComponent(title)}`
    );
    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to search books by title.' });
  }
});

// Internal local-data endpoint for title search.
publicUsers.get('/internal/search/title/:title', (req, res) => {
  const title = decodeURIComponent(req.params.title).toLowerCase();
  const results = Object.values(books).filter((book) =>
    String(book.title || '').toLowerCase().includes(title)
  );
  return res.status(200).json(results);
});

// Retrieve reviews for a specific book.
publicUsers.get('/review/:isbn', (req, res) => {
  const book = books[String(req.params.isbn)];
  if (!book) {
    return res.status(404).json({ message: 'Book not found.' });
  }
  return res.status(200).json(book.reviews || {});
});

module.exports.general = publicUsers;
