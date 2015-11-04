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

    var host_proto = (url_parts.host
      ? url_parts.protocol + '//' + url_parts.host
      : this.options.host
    );

    return host_proto + url_parts.pathname + (params ? '?' + params : '');
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
    this.http(path, 'get', next);
  },

  head: function (path, next) {
    this.http(path, 'head', next);
  },

  put: function (path, next) {
    this.http(path, 'put', next);
  },

  /**
   * @see https://tools.ietf.org/html/rfc5789
   */
  patch: function (path, next) {
    this.http(path, 'patch', next);
  },

  post: function (path, next) {
    this.http(path, 'post', next);
  },

  /**
   * @deprecated please use delete instead 
   */
  del: function (path, next) {
    this.http(path, 'delete', next);
  },
  delete: function (path, next) {
    this.http(path, 'delete', next);
  },

  http: function (path, method, next) {
    var url = this.getUrl(path);
    this.logger.debug(method.toUpperCase() + ': ' + url);

    var headers = this.merge({}, this.globals.headers, this.req.headers);

    this.logger.debug('with headers: ' + JSON.stringify(headers));

    if (this.req.body) {
      this.logger.debug('with body: ' + JSON.stringify(this.req.body));
    }

    var sendObj = {
      url: url,
      method: method,
      body: this.req.body,
      headers: headers
    };

    this.request(sendObj, function (error, response, body) {
      if (error) throw error;
      this.req = {};
      this.res.body = (typeof body === 'undefined') ? '' : body; //HEAD has no body
      this.res.headers = response.headers;
      this.res.statusCode = response.statusCode;

      this.logger.debug('response body: ' + this.res.body);

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

  /**
   * Enables modification of the JSON returned by the server via a custom callback, before the assertion is called.
   * This enables dynamic properties of the returned JSON to be stripped before the comparison is made.
   * This is for applying an assertion in the JSON with a custom callback for modifying the JSON before the comparison
   * takes place, so to account for dynamic response values, like ID fields, for example.
   *
   * this.Then(/^the response should match the following, taking into account that "([^"]*)" are dynamic fields:$/, 
   *   function(fields, exp_json, callback) {
   *     fields = fields.split(',');
   *     this.api.modifyAndAssertJSON(function(actual_json, call){
   *       var field_name, i;
   *       for (i = 0; i < fields.length; i++) {
   *         field_name = fields[i];
   *         actual_json[field_name] = "";
   *       }
   *       call(exp_json, actual_json);
   *     })
   *     .then(callback);
   *   }
   * );
   */
  modifyAndAssertJSON: function(custom_assertion) {
    var self = this;
    custom_assertion(
      JSON.parse(this.res.body),
      function(expected_json, modified_json) {
        expected_json = JSON.parse(expected_json);
        self.chai.assert.deepEqual(expected_json, modified_json);
      }
    );
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
    header = header.toLowerCase();
    this.chai.assert.isDefined(this.res.headers[header]);
    next();
  },

  assertHeaderNotExists: function(header, next) {
    header = header.toLowerCase();
    this.chai.assert.isUndefined(this.res.headers[header]);
    next();
  }
};


module.exports = Tester;
