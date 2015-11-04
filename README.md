plus.garden.api!
================
Just API tester and nothing more.



Overview
--------

The main objective of the module is testing APIs of web services. It is particularly suitable for REST architecture
 applications.



Installing/Configuring
----------------------

Suppose, you already have a project with configured garden environment (more info [here](https://github.com/linkshare/plus.garden#getting-started)).
Now you need to add _plus.garden.api_ as a dependency in your `garden/package.json`:

```json
    "dependencies": {
        /* ... */
        "plus.garden.api": "~0.0.1",
        /* ... */
      }
```

And run npm install

```bash
    npm install
```

Or just add and install the dependency automatically via npm:

```bash
    $ cd garden
    $ npm install --save plus.garden.api
```

Now register the installed module in `garden/container.js`:

```javascript
    module.exports = function (container) {
        //...
        container.register('ApiModule', require('plus.garden.api'));
        //...
    }
```

And add the registered module to garden's "world"

```javascript
    // garden/DIR_WITH_YOUR_TESTS/support/world.js

    var World = function World(callback) {
        this.api = garden.get('ApiTester');
    }
```


That's it. Your garden is ready to use the api tester.



How it works
------------

You write API tests in the same BDD style as usual for you in garden.js:

1. Write test scenarios (more info [here](https://github.com/linkshare/plus.garden#features));
2. Add missing definitions of steps where you use `plus.garden.api`;
3. Run tests.

Api tester includes two main components: HTTP/REST browserless __client__ and __tester__ that checks a response by assertions.

Let's look at an example of a common scenario and try to add a step definition using plus.garden.api

```gherkin
    # demo/get.feature

    Feature: Make a GET request
        In order to programmatically access
        As a Web Service User
        I need to have an ability to make a GET request and check response

        Scenario: Make a GET request to Fake Online REST API
          When I make GET request to "http://jsonplaceholder.typicode.com/posts/1"
          Then the status code should be 200
           And content type should be "application/json; charset=utf-8"
           And the JSON response should be:
           """
           {
             "userId": 1,
             "id": 1,
             "title": "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
             "body": "quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto"
           }
       """
```

Here you need to add 1 step definition where the client makes a GET request

```javascript
    // demo/definitions/get.js

    module.exports = function () {
        this.When(/^I make GET request to "([^"]*)"$/, function(url, callback) {
            this.api.get(url).then(callback);
        });


    }
```

and 3 step definitions where tester checks a response returned by client

```javascript
    // demo/definitions/get.js

    module.exports = function () {
        // ...
        this.Then(/^the status code should be (\d+)$/, function(statusCode, callback) {
            this.api.assertStatus(statusCode).then(callback);
        });
        this.Then(/^content type should be "([^"]*)"$/, function(contentType, callback) {
            this.api.assertContentType(contentType).then(callback);
        });
        this.Then(/^the JSON response should be:$/, function(string, callback) {
          this.api.assertJSON(JSON.parse(string)).then(callback);
        });

    }
```

This is how it works. Once again short about key steps: prepare a request, send it, check a returned response.



API Reference
-------------

* **Actions**
  * [`get`](#get)
  * [`post`](#post)
  * [`put`](#put)
  * [`delete`](#delete)
  * [`http`](#http)
  * [`head`](#head)
  * [`patch`](#patch)

* **Assertions**
  * [`assertContains`](#assertContains)
  * [`assertContentType`](#assertContentType)
  * [`assertHeaderEquals`](#assertHeaderEquals)
  * [`assertHeaderExists`](#assertHeaderExists)
  * [`assertHeaderNotExists`](#assertHeaderNotExists)
  * [`assertJSON`](#assertJSON)
  * [`assertJSONContains`](#assertJSONContains)
  * [`assertJSONElementPresented`](#assertJSONElementPresented)
  * [`assertJSONElementNotPresented`](#assertJSONElementNotPresented)
  * [`assertJSONLength`](#assertJSONLength)
  * [`assertKeysEqual`](#assertKeysEqual)
  * [`assertValuesEqual`](#assertValuesEqual)
  * [`assertStatus`](#assertStatus)
  * [`assertStatusNot`](#assertStatusNot)
  * [`assertText`](#assertText)
  * [`modifyAndAssertJSON`](#modifyAndAssertJSON)

* **Request Property**
  * [`addHeaders`](#addHeaders)
  * [`addParameters`](#addParameters)
  * [`addGlobalHeaders`](#addGlobalHeaders)
  * [`addGlobalParameters`](#addGlobalParameters)
  * [`setBody`](#setBody)
  * [`setGlobals`](#setGlobals)



Actions
-------
<a name="get" />
###get

Sends a GET request to a given `path`.

```javascript
    this.api.get(path).then(callback);
```

-------------


<a name="head" />
###head

Sends a HEAD request to a given `path`.

```javascript
    this.api.head(path).then(callback);
```

-------------


<a name="post" />
###post

Sends a POST request to a given `path`.

```javascript
    this.api.post(path).then(callback);
```

*Note: use [`setBody`](#setBody) method to set a body of request*

-------------


<a name="patch" />
###patch

Sends a PATCH request to a given `path`.

```javascript
    this.api.patch(path).then(callback);
```

*Note: use [`setBody`](#setBody) method to set a body of request*

-------------


<a name="put" />
###put

Sends a PUT request to a given `path`.

```javascript
    this.api.put(path).then(callback);
```

*Note: use [`setBody`](#setBody) method to set a body of request*

-------------


<a name="delete" />
###delete

Sends a DELETE request to a given `path`.

```javascript
    this.api.delete(path).then(callback);
```

-------------


<a name="http" />
###http

Sends an HTTP request of any request `method` to given `path`

```javascript
    this.api.http(path, method).then(callback);
```

*Note: use proper `Request Property` methods to configure a request before sending*

-------------



Assertions
----------
All assertions are made only after any request.


<a name="assertContains" />
###assertContains

Checks if the returned response contains a given `value`

```javascript
    this.api.contains(value).then(callback);
```

-------------


<a name="assertContentType" />
###assertContentType

Checks if the returned response has a given `content type`

```javascript
    this.api.assertContentType(contentType).then(callback);
```

-------------


<a name="assertHeaderEquals" />
###assertHeaderEquals

Checks if a given `header` of the returned response has the expected `value`.

```javascript
    this.api.assertHeaderEquals(header, value).then(callback);
```

-------------


<a name="assertHeaderExists" />
###assertHeaderExists

Checks if a given `header` exists in the returned response.

```javascript
    this.api.assertHeaderExists(header).then(callback);
```

-------------

<a name="assertHeaderNotExists" />
###assertHeaderNotExists

Checks if a given `header` doesn't exist in the returned response.

```javascript
    this.api.assertHeaderNotExists(header).then(callback);
```

-------------


<a name="assertJSON" />
###assertJSON

Checks if the returned response equals a given object

```javascript
    this.api.assertJSON(json).then(callback);
```

*Note: Use this method only if a response content is in JSON format. Api tester automatically parses the body of response and compares the parsed JSON with given object.*

-------------


<a name="assertJSONContains" />
###assertJSONContains

Checks if the JSON content contains given `value` by `key`.

```javascript
    this.api.assertJSONContains(key, value).then(callback);
```

*Note: `key` is a path to a specific element of JSON. Api tester use jspath to match elements. More about jspath look [here](https://github.com/dfilatov/jspath)*


-------------

<a name="assertJSONElementPresented" />
###assertJSONElementPresented

Checks if an element by given `key` is presented in the JSON content

```javascript
    this.api.assertJSONElementPresented(key).then(callback);
```

*Note: `key` is a path to a specific element of JSON. Api tester use jspath to match elements. More about jspath look [here](https://github.com/dfilatov/jspath)*

-------------


<a name="assertJSONElementNotPresented" />
###assertJSONElementNotPresented

Checks if an element by given `key` is not presented in the JSON content

```javascript
    this.api.assertJSONElementNotPresented(key).then(callback);
```

*Note: `key` is a path to a specific element of JSON. Api tester use jspath to match elements. More about jspath look [here](https://github.com/dfilatov/jspath)*

-------------


<a name="assertJSONLength" />
###assertJSONLength

Checks if an element by given `key` has a given `length`.

```javascript
    this.api.assertJSONLength(key, length).then(callback);
```

*Note: `key` is a path to a specific element of JSON. Api tester use jspath to match elements. More about jspath look [here](https://github.com/dfilatov/jspath)*

-------------


<a name="assertKeysEqual" />
###assertKeysEqual

Checks if an element by given `path` has all enumerated `keys`.

```javascript
    this.api.assertJSONLength(path, keys).then(callback);
```

*Note: `path` is to a specific element of JSON. Api tester use jspath to match elements. More about jspath look [here](https://github.com/dfilatov/jspath)*

-------------

<a name="assertValuesEqual" />
###assertKeysEqual

Checks if an element by given `path` has given `values`.

```javascript
    this.api.assertJSONLength(path, values).then(callback);
```

*Note: `path` is to a specific element of JSON. Api tester use jspath to match elements. More about jspath look [here](https://github.com/dfilatov/jspath)*

-------------


<a name="assertStatus" />
###assertStatus

Checks if the response status code equals to given.

```javascript
    this.api.assertStatus(status).then(callback);
```

-------------


<a name="assertStatusNot" />
###assertStatusNot

Checks if the response status code does not equals to given.

```javascript
    this.api.assertStatusNot(status).then(callback);
```

-------------


<a name="assertText" />
###assertText

Checks if the body of returned response equals to given `text`.

```javascript
    this.api.assertText(text).then(callback);
```

-------------

<a name="modifyAndAssertJSON" />
###modifyAndAssertJSON

Enables modification of the JSON returned by the server via a custom callback, before the assertion is called.
This enables dynamic properties of the returned JSON to be stripped before the comparison is made.
This is for applying an assertion in the JSON with a custom callback for modifying the JSON before the comparison
takes place, so to account for dynamic response values, like ID fields, for example.

```javascript
    this.api.modifyAndAssertJSON(function(actual_json, call){
      var field_name, i;
      for (i = 0; i < fields.length; i++) {
        field_name = fields[i];
        actual_json[field_name] = "";
      }
      call(exp_json, actual_json);
    })
```

-------------


Request Property
----------------

There are methods that help you to configure a request before its sending.

<a name="addHeaders" />
###addHeaders

Adds the given `headers`*<Array>* to a current request.

```javascript
    this.api.addHeaders(headers).then(callback);
```
*Note: the method doesn't replace previous headers, but merges all with the same names*

-------------


<a name="addParameters" />
###addParameters

Adds the given `parameters`*<Array>* to the current request. All parameters are converted to query string.

```javascript
    this.api.addParameters(parameters).then(callback);
```
*Note: Don't use it for POST data instead of `setBody` method. The given parameters are placed in a query string, not body*

-------------



<a name="addGlobalHeaders" />
###addGlobalHeaders

The given headers will be automatically added to each next request during tests execution.

```javascript
    this.api.addGlobalHeaders(headers).then(callback);
```

-------------


<a name="addGlobalParameters" />
###addGlobalParameters

The given parameters will be automatically added to each next request during tests execution.

```javascript
    this.api.addGlobalParameters(parameters).then(callback);
```

-------------


<a name="setBody" />
###setBody

Sets a given `body` to the current request. It's irreplaceable thing for POST, PUT requests.

```javascript
    this.api.setBody(body).then(callback);
```

-------------


<a name="setGlobals" />
###setGlobals

A tiny tricky method that allows you to set globals in one action. `globals` is an object that has 2 properties: `headers`*<Array>*
and `parameters`*<Array>*.

```javascript
    this.api.addGlobalParameters(globals).then(callback);
```

*Attention: Don't use it if you don't understand what you do.*

-------------

## Authors

-   [Vadim Tiukov](mailto:brainreflex@gmail.com) ([twitter](http://twitter.com/Elusive_Joe))

## License

plus.garden.api is distributed under the terms of the MIT license - see the `LICENSE` file for details
