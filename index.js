/* =====================================================================================
 * @author Vadim Tiukov
 * =====================================================================================
 * Copyright (c) 2015 Rakuten Marketing
 * Licensed under MIT (https://github.com/linkshare/plus.garden.api/blob/master/LICENSE)
 * ===================================================================================== */

module.exports = function (Garden) {
    Garden.load({dir: __dirname});
};

module.exports.$inject = ['Garden'];
module.exports.$tags = ['garden.js', 'module'];