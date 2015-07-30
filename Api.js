/* =====================================================================================
 * @author Vadim Tiukov
 * =====================================================================================
 * Copyright (c) 2015 Rakuten Marketing
 * Licensed under MIT (https://github.com/linkshare/plus.garden.api/blob/master/LICENSE)
 * ===================================================================================== */

var Api = function (config, logger) {
    this.config = config;
    this.Tester = require('chainit')(require('./Tester'));

    return new this.Tester(logger, config.get());
};

module.exports = Api;
module.exports.$inject = ['config', 'Logger'];
