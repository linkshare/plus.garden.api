/* =====================================================================================
 * @author Vadim Tiukov
 * =====================================================================================
 * Copyright (c) 2015 Rakuten Marketing
 * Licensed under MIT (https://github.com/linkshare/plus.garden.api/blob/master/LICENSE)
 * ===================================================================================== */

var Tester = function (logger, options) {
  var qs = require('querystring');
  var url = require('url');

  this.jsondiffpatch = require('jsondiffpatch');
  this.request = require('request');
  this.merge = require('merge');
  this.jspath = require('jspath');
  this.chai = require('chai');
  this.logger = logger;

  this.options = options;
  this.req = {};
  this.res = {};
  this.globals = {};

  this.getUrl = function (path) {
    var url_parts = url.parse(path, true);
    var query = url_parts.query;
    var params = qs.stringify(this.merge({}, this.globals.parameters, this.req.parameters, query));

    if (url_parts.host) {
      return url_parts.protocol + '//' + url_parts.host + url_parts.pathname + '?' + params;
    }

    if (params) {
      return this.options.host + url_parts.pathname + '?' + params;
    }
    return this.options.host + url_parts.pathname;
  };

  this.convertToJson = function (table) {
    var result = {}, hashes = table.hashes(), i, j, key;

    for (i in hashes) {
      key = undefined;
      for (j in hashes[i]) {
        if (!key) {
          key = hashes[i][j];
        } else {
          result[key] = hashes[i][j];
        }
      }
    }

    return result;
  };

  this.convertToQuerystring = function (obj) {
    return Object.keys(obj).reduce(function(a,k){a.push(k+'='+encodeURIComponent(obj[k]));return a},[]).join('&')
  }

};

Tester.prototype = {

  then: function (next) {
    next();
  },

  addParameters: function (parameters, next) {
    this.req.parameters = this.merge({}, this.req.parameters, parameters);
    next();
  },

  addHeaders: function (headers, next) {
    if (headers.hashes) {
      headers = this.convertToJson(headers);
    }
    this.req.headers = this.merge({}, this.req.headers, headers);
    next();
  },

  addGlobalParameters: function (parameters, next) {
    this.globals.parameters = this.merge({}, this.globals.parameters, parameters);
    this.logger.debug('GlobalParameters: ' + JSON.stringify(this.globals.parameters));
    next();
  },

  addGlobalHeaders: function (headers, next) {
    if (headers.hashes) {
      headers = this.convertToJson(headers);
    }
    this.globals.headers = headers;
    this.logger.debug('addGlobalHeaders: ' + JSON.stringify(this.globals.headers));
    next();
  },

  setGlobals: function(globals, next) {
    this.globals = globals;
    next();
  },

  setBody: function (body, next) {
    if (body.hashes) {
      body = this.convertToJson(body);
      this.req.body = this.convertToQuerystring(body);
    } else {
      this.req.body = body;
    }
    next();
  },

  get: function (path, next) {
    var url = this.getUrl(path);

    this.logger.debug('GET: ' + url);

    var headers = this.merge({}, this.globals.headers, this.req.headers);

    this.logger.debug('with headers: ' + JSON.stringify(headers));

    this.request.get({url: url, headers: headers}, function (error, response, body) {
      if (error) throw error;
      this.req = {};
      this.res.body = body;
      this.res.headers = response.headers;
      this.res.statusCode = response.statusCode;

      next(this.res);
    }.bind(this));
  },

  put: function (path, next) {
    var url = this.getUrl(path);

    this.logger.debug('PUT: ' + url);

    var headers = this.merge({}, this.globals.headers, this.req.headers);

    this.logger.debug('with headers: ' + JSON.stringify(headers));

    if (this.req.body) {
      this.logger.debug('with body: ' + this.req.body);
    }

    this.request.put({url: url, body: this.req.body, headers: headers}, function (error, response, body) {
      if (error) throw error;
      this.req = {};
      this.res.body = body;
      this.res.headers = response.headers;
      this.res.statusCode = response.statusCode;

      next(this.res);
    }.bind(this));
  },

  post: function (path, next) {
    var url = this.getUrl(path);

    this.logger.debug('PUT: ' + url);

    var headers = this.merge({}, this.globals.headers, this.req.headers);

    this.logger.debug('with headers: ' + JSON.stringify(headers));

    if (this.req.body) {
      this.logger.debug('with body: ' + this.req.body);
    }

    this.request.post({url: url, body: this.req.body, headers: headers}, function (error, response, body) {
      if (error) throw error;
      this.req = {};
      this.res.body = body;
      this.res.headers = response.headers;
      this.res.statusCode = response.statusCode;

      next(this.res);
    }.bind(this));
  },

  del: function (path, next) {
    var url = this.getUrl(path);

    this.logger.debug('DELETE: ' + url);

    var headers = this.merge({}, this.globals.headers, this.req.headers);

    this.logger.debug('with headers: ' + JSON.stringify(headers));

    if (this.req.headers) {
      this.logger.debug('with headers: ' + JSON.stringify(this.req.headers));
    }

    this.request.del({url: url, headers: headers}, function (error, response, body) {
      if (error) throw error;
      this.req = {};
      this.res.body = body;
      this.res.headers = response.headers;
      this.res.statusCode = response.statusCode;

      next(this.res);
    }.bind(this));
  },

  http: function (path, method, next) {
    var url = this.getUrl(path);
    this.logger.debug('REQUEST (' + method + '): ' + url);

    var headers = this.merge({}, this.globals.headers, this.req.headers);
    var json = (headers['Content-Type'] == 'application/json');

    this.logger.debug('with headers: ' + JSON.stringify(headers));

    if (this.req.body) {
      this.logger.debug('with body: ' + JSON.stringify(this.req.body));
    }

    this.request({url: url, method: method, body: this.req.body, headers: headers, json: json}, function (error, response, body) {
      if (error) throw error;
      this.req = {};
      this.res.body = body;
      this.res.headers = response.headers;
      this.res.statusCode = response.statusCode;

      next(this.res);
    }.bind(this));
  },

  assertStatus: function (statusCode, next) {
    this.chai.assert.equal(statusCode, this.res.statusCode);
    next();
  },

  assertStatusNot: function (statusCode, next) {
    this.chai.assert.notEqual(statusCode, this.res.statusCode);
    next();
  },

  assertContentType: function (contentType, next) {
    this.chai.assert.include(this.res.headers['content-type'], contentType);
    next();
  },

  assertJSON: function (json, next) {
    this.chai.assert.deepEqual(json, JSON.parse(this.res.body));
    next();
  },

  assertJSONContains: function (key, value, next) {
    var givenValue = this.jspath.apply(key, JSON.parse(this.res.body));
    this.logger.debug('JSON path: ' +  key);
    this.logger.debug('selected JSON: ' +  JSON.stringify(givenValue));
    this.chai.assert.equal(value, givenValue);
    next();
  },

  assertJSONElementPresented: function (key, next) {
    var givenValue = this.jspath.apply(key, JSON.parse(this.res.body));
    this.logger.debug('JSON path: ' +  key);
    this.logger.debug('selected JSON: ' +  JSON.stringify(givenValue));
    if (!givenValue.length) {
      this.chai.assert(false, 'element '+ key +' are not presented');
    }
    next();
  },

  assertJSONElementNotPresented: function (key, next) {
    var givenValue = this.jspath.apply(key, JSON.parse(this.res.body));
    this.logger.debug('JSON path: ' +  key);
    this.logger.debug('selected JSON: ' +  JSON.stringify(givenValue));
    if (givenValue.length) {
      this.chai.assert(false, 'element '+ key +' are presented');
    }
    next();
  },

  assertKeysEqual: function (path, keys, next) {
    var givenValue = this.jspath.apply(path, JSON.parse(this.res.body));
    this.logger.debug('JSON path: ' +  path);
    this.logger.debug('selected JSON: ' +  JSON.stringify(givenValue));
    this.chai.assert.equal(Object.keys(givenValue).length, Object.keys(keys).length);
    for (var k in keys) {
        this.chai.assert.equal(givenValue.hasOwnProperty(keys[k]), true);
    }
    next();
  },

  assertValuesEqual: function (path, values, next) {
    var givenValues = this.jspath.apply(path, JSON.parse(this.res.body));
    this.logger.debug('JSON path: ' +  path);
    this.logger.debug('selected JSON: ' +  JSON.stringify(givenValues));
    this.chai.assert.deepEqual(values, givenValues);
    next();
  },

  assertJSONLength: function (key, value, next) {
    var givenValue = this.jspath.apply(key, JSON.parse(this.res.body));
    this.logger.debug('JSON path: ' +  key);
    this.logger.debug('selected JSON: ' +  JSON.stringify(givenValue));
    this.chai.assert.equal(Object.keys(givenValue).length, value);
    next();
  },

  assertText: function (text, next) {
    this.chai.assert.equal(text, this.res.body);
    next();
  },

  assertContains: function (value, next) {
    this.chai.assert.include(this.res.body, value);
    next();
  },

  assertHeaderEquals: function(header, value, next) {
    this.chai.assert.include(this.res.headers[header], value);
    next();
  },

  assertHeaderExists: function(header, next) {
    this.chai.assert.isDefined(this.res.headers[header]);
    next();
  },

  assertHeaderNotExists: function(header, next) {
    this.chai.assert.isUndefined(this.res.headers[header]);
    next();
  }
};


module.exports = Tester;
