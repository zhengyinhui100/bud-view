/**
 * Copyright(c) Alibaba Group Holding Limited.
 *
 */

'use strict';

/**
 * Module dependencies.
 */
const ARTView = require('./lib/art_view');

module.exports = function(app) {
  app.view.use('budView', ARTView);
  // app[Symbol.for('egg#view')] = ARTView;
};
