'use strict';

const nconf = module.exports = require('nconf');
const path = require('path');

nconf
  .argv()
  .env([
    'CLOUD_BUCKET',
    'DATA_BACKEND',
    'GCLOUD_PROJECT',
    'INSTANCE_CONNECTION_NAME',
    'MONGO_URL',
    'MONGO_COLLECTION',
    'MONGO_DB_NAME',
    'MYSQL_USER',
    'MYSQL_PASSWORD',
    'NODE_ENV',
    'PORT'
  ])
  .file({ file: path.join(__dirname, 'config.json') })
  .defaults({
    CLOUD_BUCKET: 'jidnyasa-sentiment-01',
    MONGO_DB_NAME: 'sentiment',
    DATA_BACKEND: 'mongodb',
    GCLOUD_PROJECT: 'jidnyasa-sentiment-01',
    MONGO_URL: 'mongodb://root:MAV7jCatvF8e@localhost:27017',
    SENTIMENTS_COLLECTION: 'sentiments',
    PORT: 8080
  });

// Check for required settings
checkConfig('GCLOUD_PROJECT');
checkConfig('CLOUD_BUCKET');

if (nconf.get('DATA_BACKEND') === 'cloudsql') {
  checkConfig('MYSQL_USER');
  checkConfig('MYSQL_PASSWORD');
  if (nconf.get('NODE_ENV') === 'production') {
    checkConfig('INSTANCE_CONNECTION_NAME');
  }
} else if (nconf.get('DATA_BACKEND') === 'mongodb') {
  checkConfig('MONGO_URL');
  checkConfig('SENTIMENTS_COLLECTION');
  checkConfig('MONGO_DB_NAME');
}

function checkConfig (setting) {
  if (!nconf.get(setting)) {
    throw new Error(`You must set ${setting} as an environment variable or in config.json!`);
  }
}
