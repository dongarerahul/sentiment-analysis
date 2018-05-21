'use strict';

const path = require('path');
const express = require('express');
const config = require('./config');

const app = express();

app.disable('etag');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.set('trust proxy', true);

app.use('/books',          require('./books/crud'));
app.use('/api/books',      require('./books/api'));
app.use('/api/sentiments', require('./sentiments/api'));
app.use('/sentiments',     require('./sentiments/crud'));
app.use('/administration', require('./admin/job'));

// Redirect root to /books
app.get('/', (req, res) => {
  res.redirect('/sentiments');
});

// Basic 404 handler
app.use((req, res) => {
  res.status(404).send('Not Found !');
});

// Basic error handler
app.use((err, req, res, next) => {
  /* jshint unused:false */
  console.error(err);
  // If our routes specified a specific response, then send that. Otherwise,
  // send a generic message so as not to leak anything.
  res.status(500).send(err.response || 'Something broke!');
});

if (module === require.main) {

  const server = app.listen(config.get('PORT'), () => {
    const port = server.address().port;
    console.log(`App listening on port ${port}`);
  });
}

module.exports = app;
