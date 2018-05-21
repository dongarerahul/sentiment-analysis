'use strict';

const express = require('express');
const bodyParser = require('body-parser');

const router = express.Router();
router.use(bodyParser.json());

router.use((req, res, next) => {
  res.set('Content-Type', 'text/html');
  next();
});

router.get('/', (req, res, next) => {
  console.log("Inside Admin !");
  res.render('admin/view.pug', {
    action: 'View'
  });
})
module.exports = router;
