const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const customer_routes = require('./router/auth_users.js').authenticated;
const genl_routes = require('./router/general.js').general;

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'fingerprint_customer';

app.use(express.json());
app.use('/customer', session({
  secret: JWT_SECRET,
  resave: false,
  saveUninitialized: false
}));

// Verify the Bearer token for protected customer review routes.
app.use('/customer/auth/*', (req, res, next) => {
  const authorization = req.headers.authorization || '';
  const [scheme, token] = authorization.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Access token required. Use Authorization: Bearer <token>.' });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired access token.' });
  }
});

const PORT = process.env.PORT || 5000;
app.use('/customer', customer_routes);
app.use('/', genl_routes);

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

module.exports = app;
