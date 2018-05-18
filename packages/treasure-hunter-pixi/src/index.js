if (process.env.NODE_ENV !== 'production') {
  const eruda = require('eruda');
  eruda.init();
}
require('normalize.css');
require('./index.css');
require('./setup');
