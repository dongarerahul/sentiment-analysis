'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const images = require('../lib/images');
const language = require('@google-cloud/language').v1beta2;
const client = new language.LanguageServiceClient();

function getModel () {
  debugger;
  return require(`./model-${require('../config').get('DATA_BACKEND')}`);
}

const router = express.Router();
router.use(bodyParser.urlencoded({ extended: false }));

// Set Content-Type for all responses for these routes
router.use((req, res, next) => {
  res.set('Content-Type', 'text/html');
  next();
});

router.get('/', (req, res, next) => {
  getModel().list(10, req.query.pageToken, (err, entities, cursor) => {
    if (err) {
      next(err);
      return;
    }
    console.log(entities)
    res.render('sentiments/list.pug', {
      sentiments: entities,
      nextPageToken: cursor
    });
  });
});

/**
 * GET /sentiments/add  Display a form for creating a sentiment.
 */
router.get('/add', (req, res) => {
  res.render('sentiments/form.pug', {
    sentiment: {},
    action: 'Add'
  });
});

/**
 * POST /sentiments/add Create a sentiment.
 */
router.post(
  '/add',
  images.multer.single('image'),
  images.sendUploadToGCS,
  (req, res, next) => {
    let data = req.body;

    // Was an image uploaded? If so, we'll use its public URL
    // in cloud storage.
    if (req.file && req.file.cloudStoragePublicUrl) {
      data.imageUrl = req.file.cloudStoragePublicUrl;
    }
    const document = { content: req.body.input, type: 'PLAIN_TEXT' };

    client.analyzeSentiment({document: document})
        .then(results => {
          const sentiment = results[0].documentSentiment;
          console.log(`Results of Fetching Text sentiment:`);
          console.log("Summary: ", JSON.stringify(sentiment, null, 2));

          data.score = sentiment.score;
          data.magnitude = sentiment.magnitude;
          data.scoreType = 1;
          console.log("Enriched Data: ", JSON.stringify(data, null, 2));

          const sentences = results[0].sentences;
          sentences.forEach(sentence => {
            console.log(`Sentence: ${sentence.text.content}`);
            console.log(`  Score: ${sentence.sentiment.score}`);
            console.log(`  Magnitude: ${sentence.sentiment.magnitude}`);
          });

          getModel().create(data, (err, savedData) => {
            if (err) { next(err); return; }
            res.redirect(`${req.baseUrl}/${savedData.id}`);
          });

        })
        .catch(err => {
          console.error('ERROR:', err);
        });


    }
  );
// [END add]

/**
 * GET /sentiments/:id/edit
 *
 * Display a sentiment for editing.
 */
router.get('/:sentiment/edit', (req, res, next) => {
  getModel().read(req.params.sentiment, (err, entity) => {
    if (err) {
      next(err);
      return;
    }
    res.render('sentiments/form.pug', {
      sentiment: entity,
      action: 'Edit'
    });
  });
});

/**
 * POST /sentiments/:id/edit
 *
 * Update a sentiment.
 */
router.post(
  '/:sentiment/edit',
  images.multer.single('image'),
  images.sendUploadToGCS,
  (req, res, next) => {
    let data = req.body;

    if (req.file && req.file.cloudStoragePublicUrl) {
      req.body.imageUrl = req.file.cloudStoragePublicUrl;
    }

    const document = { content: req.body.input, type: 'PLAIN_TEXT' };

    client.analyzeSentiment({document: document})
        .then(results => {
          const sentiment = results[0].documentSentiment;
          console.log(`Results of Fetching Text sentiment:`);
          console.log("Summary: ", JSON.stringify(sentiment, null, 2));

          data.score = sentiment.score;
          data.magnitude = sentiment.magnitude;
          data.scoreType = 1;
          console.log("Enriched Data: ", JSON.stringify(data, null, 2));

          const sentences = results[0].sentences;
          sentences.forEach(sentence => {
            console.log(`Sentence: ${sentence.text.content}`);
            console.log(`  Score: ${sentence.sentiment.score}`);
            console.log(`  Magnitude: ${sentence.sentiment.magnitude}`);
          });

          getModel().update(req.params.sentiment, data, (err, savedData) => {
            if (err) { next(err); return; }
          });

        })
        .catch(err => {
          console.error('ERROR:', err);
        });
        res.redirect(`${req.baseUrl}`);
    }
);

/**
 * GET /sentiments/:id
 *
 * Display a sentiment.
 */
router.get('/:sentiment', (req, res, next) => {
  getModel().read(req.params.sentiment, (err, entity) => {
    console.log("Fetched Entity:++++++++ ", entity);
    if (err) {
      next(err);
      return;
    }

    res.render('sentiments/view.pug', {
      sentiment: entity
    });
  });
});

/**
 * GET /sentiments/:id/delete
 *
 * Delete a sentiment.
 */
router.get('/:sentiment/delete', (req, res, next) => {
  getModel().delete(req.params.sentiment, (err) => {
    if (err) {
      next(err);
      return;
    }
    res.redirect(req.baseUrl);
  });
});

/**
 * Errors on "/sentiments/*" routes.
 */
router.use((err, req, res, next) => {
  // Format error and forward to generic error handler for logging and
  // responding to the request
  err.response = err.message;
  next(err);
});

module.exports = router;
