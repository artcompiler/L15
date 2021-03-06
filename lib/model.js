/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil; tab-width: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
/*
 * Copyright 2013 Art Compiler LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
"use strict";
/*
  Backward.js defines lexically scoped functions to support backward
  compatibility with IE8.

  Derived from https://github.com/kriskowal/es5-shim
*/

// ES5 15.4.4.18
// http://es5.github.com/#x15.4.4.18
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/array/forEach

// Check failure of by-index access of string characters (IE < 9)
// and failure of `0 in boxedString` (Rhino)
var boxedString = Object("a"),
    splitString = boxedString[0] != "a" || !(0 in boxedString);

var forEach = function forEach(array, fun) {  
  var thisp = arguments[2];
  if (Array.prototype.forEach) {
	  return array.forEach(fun);
  }
  var object = toObject(array),
      self = splitString && _toString(object) == "[object String]" ? object.split("") : object,
      i = -1,
      length = self.length >>> 0;

  // If no callback function or if callback is not a callable function
  if (_toString(fun) != "[object Function]") {
    throw new TypeError(); // TODO message
  }
    
  while (++i < length) {
    if (i in self) {
      // Invoke the callback function with call, passing arguments:
      // context, property value, property key, thisArg object
      // context
      fun.call(thisp, self[i], i, object);
    }
  }
};


// ES5 15.4.4.20
// http://es5.github.com/#x15.4.4.20
// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/filter
var filter = function filter(array, fun /*, thisp */) {
  var thisp = arguments[2];
  if (Array.prototype.filter) {
	  return array.filter(fun);
  }
  var object = toObject(array),
      self = splitString && _toString(array) == "[object String]" ? array.split("") : object,
      length = self.length >>> 0,
      result = [],
      value;

  // If no callback function or if callback is not a callable function
  if (_toString(fun) != "[object Function]") {
    throw new TypeError(fun + " is not a function");
  }
  
  for (var i = 0; i < length; i++) {
    if (i in self) {
      value = self[i];
      if (fun.call(thisp, value, i, object)) {
        result.push(value);
      }
    }
  }
  return result;
};

// ES5 15.4.4.16
// http://es5.github.com/#x15.4.4.16
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/every
var every = function every(array, fun /*, thisp */) {
  var thisp = arguments[2];
  if (Array.prototype.every) {
	  return array.every(fun, thisp);
  }
  var object = toObject(array),
      self = splitString && _toString(array) == "[object String]" ? array.split("") : object,
      length = self.length >>> 0;

  // If no callback function or if callback is not a callable function
  if (_toString(fun) != "[object Function]") {
    throw new TypeError(fun + " is not a function");
  }
  
  for (var i = 0; i < length; i++) {
    if (i in self && !fun.call(thisp, self[i], i, object)) {
      return false;
    }
  }
  return true;
};

// ES5 15.4.4.17
// http://es5.github.com/#x15.4.4.17
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/some
var some = function some(array, fun /*, thisp */) {
  var thisp = arguments[2];
  if (Array.prototype.some) {
	  return array.some(fun, thisp);
  }
  var object = toObject(array),
      self = splitString && _toString(array) == "[object String]" ? array.split("") : object,
      length = self.length >>> 0;

  // If no callback function or if callback is not a callable function
  if (_toString(fun) != "[object Function]") {
    throw new TypeError(fun + " is not a function");
  }

  for (var i = 0; i < length; i++) {
    if (i in self && fun.call(thisp, self[i], i, object)) {
      return true;
    }
  }
  return false;
};

// ES5 15.4.4.14
// http://es5.github.com/#x15.4.4.14
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/indexOf
var indexOf = function indexOf(array, sought /*, fromIndex */ ) {
  var fromIndex = arguments[2];
  if (Array.prototype.indexOf || typeof array === "string") {
	  return array.indexOf(sought, fromIndex);
  }
  var self = splitString && _toString(array) == "[object String]" ? array.split("") : toObject(array),
      length = self.length >>> 0;

  if (!length) {
    return -1;
  }

  var i = 0;
  if (arguments.length > 2) {
    i = toInteger(fromIndex);
  }
  
  // handle negative indices
  i = i >= 0 ? i : Math.max(0, length + i);
  for (; i < length; i++) {
    if (i in self && self[i] === sought) {
      return i;
    }
  }
  return -1;
};

// ES5 15.2.3.14
// http://es5.github.com/#x15.2.3.14
var keys = function keys(object) {
  if (Object.keys) {
	  return Object.keys(object);
  }
  // http://whattheheadsaid.com/2010/10/a-safer-object-keys-compatibility-implementation
  var hasDontEnumBug = true,
  dontEnums = [
    "toString",
    "toLocaleString",
    "valueOf",
    "hasOwnProperty",
    "isPrototypeOf",
    "propertyIsEnumerable",
    "constructor"
  ],
  dontEnumsLength = dontEnums.length;
  
  for (var key in {"toString": null}) {
    hasDontEnumBug = false;
  }

  if ((typeof object != "object" && typeof object != "function") ||
      object === null) {
    throw new TypeError("Object.keys called on a non-object");
  }
  
  var keys = [];
  for (var name in object) {
    if (owns(object, name)) {
      keys.push(name);
    }
  }
  
  if (hasDontEnumBug) {
    for (var i = 0, ii = dontEnumsLength; i < ii; i++) {
      var dontEnum = dontEnums[i];
      if (owns(object, dontEnum)) {
        keys.push(dontEnum);
      }
    }
  }
  return keys;
};

// ES5 9.9
// http://es5.github.com/#x9.9
var toObject = function (o) {
  if (o == null) { // this matches both null and undefined
    throw new TypeError("can't convert "+o+" to object");
  }
  return Object(o);
};

//var call = Function.prototype.call;
//var prototypeOfArray = Array.prototype;
var prototypeOfObject = Object.prototype;
//var _Array_slice_ = prototypeOfArray.slice;
// Having a toString local variable name breaks in Opera so use _toString.
var _toString = function (val) { return prototypeOfObject.toString.apply(val); }; //call.bind(prototypeOfObject.toString);
var owns = function (object, name) { return prototypeOfObject.hasOwnProperty.call(object, name); }; //call.bind(prototypeOfObject.hasOwnProperty);

var create = function create(o) {
  if(Object.create) {
    return Object.create(o)
  }
  var F = function () {};
  if (arguments.length != 1) {
    throw new Error('Object.create implementation only accepts one parameter.');
  }
  F.prototype = o;
  return new F();
};

// From: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON
if (typeof window === "object" && !window.JSON) {
  window.JSON = {
    parse: function(sJSON) { return eval('(' + sJSON + ')'); },
    stringify: (function () {
      var toString = Object.prototype.toString;
      var isArray = Array.isArray || function (a) { return toString.call(a) === '[object Array]'; };
      var escMap = {'"': '\\"', '\\': '\\\\', '\b': '\\b', '\f': '\\f', '\n': '\\n', '\r': '\\r', '\t': '\\t'};
      var escFunc = function (m) { return escMap[m] || '\\u' + (m.charCodeAt(0) + 0x10000).toString(16).substr(1); };
      var escRE = /[\\"\u0000-\u001F\u2028\u2029]/g;
      return function stringify(value) {
        if (value == null) {
          return 'null';
        } else if (typeof value === 'number') {
          return isFinite(value) ? value.toString() : 'null';
        } else if (typeof value === 'boolean') {
          return value.toString();
        } else if (typeof value === 'object') {
          if (typeof value.toJSON === 'function') {
            return stringify(value.toJSON());
          } else if (isArray(value)) {
            var res = '[';
            for (var i = 0; i < value.length; i++)
              res += (i ? ', ' : '') + stringify(value[i]);
            return res + ']';
          } else if (toString.call(value) === '[object Object]') {
            var tmp = [];
            for (var k in value) {
              if (value.hasOwnProperty(k))
                tmp.push(stringify(k) + ': ' + stringify(value[k]));
            }
            return '{' + tmp.join(', ') + '}';
          }
        }
        return '"' + value.toString().replace(escRE, escFunc) + '"';
      };
    })()
  };
}





/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil; tab-width: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
/*
 * Copyright 2013 Art Compiler LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
"use strict";
/*
  ASSERTS AND MESSAGES

  We use the 'assert()' function to trap invalid states of all kinds. External
  messages are distinguished from internal messages by a numeric prefix that
  indicates the error code associated with the message. For example, the
  following two asserts implement an internal and external assert, respectively.

     assert(false, "This code is broken.");
     assert(false, "1001: Invalid user input.");

  To aid in the writing of external messages, we keep them in a single global
  table named 'Assert.messages'. Each module adds to this table its own messages
  with an expression such as

     messages[1001] = "Invalid user input.";

  These messages are accessed with the 'message' function as such

     message(1001);

  Calling 'assert' with 'message' looks like

     assert(x != y, message(1001));

  ALLOCATING ERROR CODES

  In order to avoid error code conflicts, each module claims a range of values
  that is not already taken by the modules in the same system. A module claims
  a range of codes by calling the function reserveCodeRange() like this:

     reserveCodeRange(1000, 1999, "mymodule");

  If the requested code range has any values that are already reserved, then
  an assertion is raised.

  USAGE

  In general, only allocate message codes for external asserts. For internal
  asserts, it is sufficient to simply inline the message text in the assert
  expression.

  It is good to write an assert for every undefined state, regardless of whether
  it is the result of external input or not. Asserts can then be externalized if
  and when they it is clear that they are the result of external input.

  A client module can override the messages provided by the libraries it uses by
  simply redefining those messages after the defining library is loaded. That is,
  the client can copy and past the statements of the form

     messages[1001] = "Invalid user input.";

  and provide new text for the message.

     messages[1001] = "Syntax error.";

  In the same way different sets of messages can be overridden for the purpose
  of localization.

*/

var ASSERT = true;
var assert = (function () {
  return !ASSERT ?
    function () { } :
    function (val, str, location) {
      if ( str === void 0 ) {
        str = "failed!";
      }
      if ( !val ) {
        var err = new Error(str);
        err.location = location ? location : Assert.location;
        throw err;
      }
    }
})();

var message = function (errorCode, args) {
  var str = Assert.messages[errorCode];
  var location = Assert.location;
  if (args) {
    forEach(args, function (arg, i) {
      str = str.replace("%" + (i + 1), arg);
    });
  }
  return errorCode + ": " + str;
};

var reserveCodeRange = function (first, last, moduleName) {
  assert(first <= last, "Invalid code range");
  var noConflict = every(Assert.reservedCodes, function (range) {
    return last < range.first || first > range.last;
  });
  assert(noConflict, "Conflicting request for error code range");
  Assert.reservedCodes.push({first: first, last: last, name: moduleName});
}

var setLocation = function (location) {
  //assert(location, "Empty location");
  Assert.location = location;
}

var clearLocation = function () {
  Assert.location = null;
}

var setCounter = function (count, message) {
  Assert.count = count;
  Assert.countMessage = message ? message : "ERROR count exceeded";
}

var checkCounter = function () {
  var count = Assert.count;
  if (typeof count !== "number" || isNaN(count)) {
    assert(false, "ERROR counter not set");
    return;
  }
  assert(Assert.count--, Assert.countMessage);
}
    

// Namespace functions for safe keeping.
var Assert = {
  assert: assert,
  message: message,
  messages: {},
  reserveCodeRange: reserveCodeRange,
  reservedCodes: [],
  setLocation: setLocation,
  clearLocation: clearLocation,
  setCounter: setCounter,
  checkCounter: checkCounter,
};
/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil; tab-width: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
/*
 * Copyright 2013 Art Compiler LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
"use strict";
var TRACE = false;
var global = this;
var trace = (function () {
  return !TRACE ?
    function () { } :
    function trace(str) {
      if (global.console && global.console.log) {
        console.log(str);
      } else if (global.print) {
        print(str);
      } else {
        throw "No trace function defined!";
      }
    }
})();
/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil; tab-width: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
/*
 * Copyright 2013 Art Compiler LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
"use strict";
/*
  This module implements the node factory for abstract syntax trees (AST).

  Each node inherits an Ast instance as it prototype.

  All Ast instances share the same node pool and therefore intern trees of
  identical structure to the same node id.

  Construct new nodes using the following forms:
    ast.create("+").arg(10).arg(20);
    ast.create("+", [10, 20]);
    ast.create({op: "+", args: [10, 20]});

  Node manipulation functions are chainable.

 */

var Ast = (function () {
  // Pool of nodes. Shared between all Ast instances.
  var nodePool = [ "unused" ];  // nodePool[0] is reserved

  // Maps for fast lookup of nodes. Shared betwen all Ast instances.
  var numberMap = {};
  var stringMap = {};
  var nodeMap = {};

  function Ast() {
  }

  Ast.clearPool = function () {
    nodePool = ["unused"];
    numberMap = {};
    stringMap = {};
    nodeMap = {};
  }

  // Create a node for operation 'op'
  Ast.prototype.create = function create(op, args) {
    // Create a node that inherits from Ast
    var node = create(this);
    if (typeof op === "string") {
      node.op = op;
      if (args instanceof Array) {
        node.args = args;
      } else {
        node.args = [];
      }
    } else if (op !== null && typeof op === "object") {
      var obj = op;
      forEach(keys(obj), function (v, i) {
        node[v] = obj[v];
      });
    }
    return node;
  }

  // Append node to this node's args.
  Ast.prototype.arg = function arg(node) {
    if (!isNode(this)) {
      throw "Malformed node";
    }
    this.args.push(node);
    return this;
  }

  // Get or set the Nth arg of this node.
  Ast.prototype.argN = function argN(i, node) {
    if (!isNode(this)) {
      throw "Malformed node";
    }
    if (node === undefined) {
      return this.args[i];
    }
    this.args[i] = node;
    return this;
  }

  // Get or set the args of this node.
  Ast.prototype.args = function args(a) {
    if (!isNode(this)) {
      throw "Malformed node";
    }
    if (a === undefined) {
      return this.args;
    }
    this.args = a;
    return this;
  }

  // Check if obj is a value node object [private]
  Ast.prototype.isNode = isNode;

  function isNode(obj) {
    if (obj === undefined) {
      obj = this;
    }
    return obj.op && obj.args;
  }

  // Intern an AST into the node pool and return its node id.
  Ast.intern = Ast.prototype.intern = function intern(node) {
    if (this instanceof Ast &&
        node === undefined &&
        isNode(this)) {
      // We have an Ast that look like a node
      node = this;
    }
    assert(typeof node === "object", "node not an object");
    var op = node.op;
    var count = node.args.length;
    var args = "";
    var args_nids = [ ];
    for (var i=0; i < count; i++) {
      if (typeof node.args[i] === "string") {
        args += args_nids[i] = node.args[i];
      } else {
        args += args_nids[i] = intern(node.args[i]);
      }
    }
    var key = op + count + args;
    var nid = nodeMap[key];
    if (nid === void 0) {
      nodePool.push({
        op: op,
        args: args_nids,
      });
      nid = nodePool.length - 1 ;
      nodeMap[key] = nid;
    }
    return nid;
  };

  // Get a node from the node pool.
  Ast.node = Ast.prototype.node = function node(nid) {
    var n = JSON.parse(JSON.stringify(nodePool[nid]));
    for (var i=0; i < n.args.length; i++) {
      // If string, then not a nid.
      if (typeof n.args[i] !== "string") {
        n.args[i] = this.node(n.args[i]);
      }
    }
    return n;
  };

  // Dump the contents of the node pool.
  Ast.dumpAll = Ast.prototype.dumpAll = function dumpAll() {
    var s = "";
    var ast = this;
    
    forEach(nodePool, function (n, i) {
      s += "\n" + i + ": " + Ast.dump(n);
    });
    return s;
  };

  // Dump the contents of a node.
  Ast.dump = Ast.prototype.dump = function dump(n) {
    if (typeof n === "string") {
      var s = "\""+n+"\"";
    } else if (typeof n === "number") {
      var s = n;
    } else {
      var s = "{ op: \"" + n.op + "\", args: [ ";
      for (var i=0; i < n.args.length; i++) {
        if (i > 0) {
          s += " , ";
        }
        s += dump(n.args[i]);
      }
      s += " ] }";
    }
    return s;
  };

  // Self tests
  var RUN_SELF_TESTS = false;
  function test() {
    (function () {
      trace("Ast self testing");
      var ast = new Ast();
      var node1 = {op: "+", args: [10, 20]};
      var node2 = {op: "+", args: [10, 30]};
      var node3 = {op: "num", args: [10]};
      var node4 = ast.create("+").arg(10).arg(30);
      var node5 = ast.create("+", [10, 20]);
      var node6 = ast.create({op: "+", args: [10, 20]});
      var nid1 = ast.intern(node1);
      var nid2 = ast.intern(node2);
      var nid3 = ast.intern(node3);
      var nid4 = node4.intern();
      var nid5 = node5.intern();
      var nid6 = node6.intern();
      var result = nid2 === nid4 ? "PASS" : "FAIL";
      trace(result + ": " + "nid2 === nid4");
      var result = nid1 === nid5 ? "PASS" : "FAIL";
      trace(result + ": " + "nid1 === nid5");
      var result = nid5 === nid6 ? "PASS" : "FAIL";
      trace(result + ": " + "nid5 === nid6");
    })();
  }
  if (RUN_SELF_TESTS) {
    test();
  }

  return Ast;
})();
/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil; tab-width: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
/*
 * Copyright 2013 Art Compiler LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
  This module defines an object model for evaluating and comparing LaTex
  strings. The primary data structure is the Model class. Instances of the
  Model class contain an AST (Ast instance) and zero or more plugins that
  provide functions for evaluating, transforming and comparing models.

  Basic Terms

  Node - a node is a raw JavaScript object that consists of an 'op' property
  that is a string indicating the node type, an 'args' property that is an array
  that holds the operands of the operation, and any other "attribute" properties
  used by plugins to elaborate the mean meaning of the node.

  AST - an AST is an a Node that is an instance of the Ast class. The Ast class
  provides methods for constructing and managing nodes.

  Model - a model is a Node that is an instance of the Model class, which
  inherits from the Ast class. The model class adds methods for creating nodes
  from LaTex strings and rendering them to LaTex strings. Model values are
  configured by Model plugins that implement operations for evaluating,
  transforming and comparing nodes.

  Overview

  Every model object is also a factory for other model objects that share
  the same set of plugins.

    Model.fn.isEquivalent; // register plugin function
    var model = new Model;
    var expected = model.create("1 + 2");
    var actual = model.create(response);
    model.isEquivalent(expected, actual);
    expected.isEquivalent(actual);

  When all models in a particular JavaScript sandbox (global scope) use the same
  plugins, those plugins can be registered with the Model class as default
  plugins, as follows:

*/
"use strict";
var Model = (function () {

  function error(str) {
    trace("error: " + str);
  }

  function Model() {
  }

  Model.fn = {};
  Model.env = env = {};
  var envStack = [];
  var env = {};

  Model.pushEnv = function pushEnv(e) {
    envStack.push(env);
    Model.env = env = e;
  }

  Model.popEnv = function popEnv() {
    assert(envStack.length > 0, "Empty envStack");
    Model.env = env = envStack.pop();
  }

  function isChemCore() {
    // Has chem symbols so in chem mode
    return !!Model.env["Au"];
  }

  var Mp = Model.prototype = new Ast();

  // Add messages here
  Assert.reserveCodeRange(1000, 1999, "model");
  Assert.messages[1001] = "Invalid syntax. '%1' expected, '%2' found.";
  Assert.messages[1002] = "Only one decimal separator can be specified.";
  Assert.messages[1003] = "Extra characters in input at position: %1, lexeme: %2.";
  Assert.messages[1004] = "Invalid character '%1' (%2) in input.";
  Assert.messages[1005] = "Misplaced thousands separator.";
  Assert.messages[1006] = "Unexpected expression: %1";
  Assert.messages[1007] = "Unexpected character: '%1' in '%2'.";
  Assert.messages[1008] = "The same character '%1' is being used as a thousands and decimal separators.";
  Assert.messages[1009] = "Missing argument for '%1' command.";
  var message = Assert.message;

  // Create a model from a node object or expression string
  Model.create = Mp.create = function create(node, location) {
    assert(node != undefined, "Model.create() called with invalid argument " + node);
    // If we already have a model, then just return it.
    if (node instanceof Model) {
      if (location) {
        node.location = location;
      }
      return node;
    }
    var model;
    if (node instanceof Array) {
      model = [];
      forEach(node, function (n) {
        model.push(create(n, location));
      });
      return model;
    }
    if (!(this instanceof Model)) {
      return new Model().create(node, location);
    }
    // Create a node that inherits from Ast
    model = create(this);
    model.location = location;
    if (typeof node === "string") {
      // Got a string, so parse it into a node
      node = parse(node, Model.env).expr();
    } else {
      // Make a deep copy of the node
      node = JSON.parse(JSON.stringify(node));
    }
    // Add missing plugin functions to the Model prototype
    forEach(keys(Model.fn), function (v, i) {
      if (!Mp.hasOwnProperty(v)) {
        Mp[v] = function () {
          var fn = Model.fn[v];
          if (arguments.length > 1 &&
              arguments[1] instanceof Model) {
            return fn.apply(this, arguments);
          } else {
            var args = [this];
            for (var i = 0; i < arguments.length; i++) {
              args.push(arguments[i]);
            }
            return fn.apply(this, args);
          }
        }
      }
    });
    // Now copy the node's properties into the model object
    forEach(keys(node), function (v, i) {
      model[v] = node[v];
    });
    return model;
  };

  // Create a Model node from LaTex source.
  Model.fromLaTex = Mp.fromLaTex = function fromLaTex(src) {
    assert(typeof src === "string", "Model.prototype.fromLaTex");
    if (!this) {
      return Model.create(src);
    }
    return this.create(src);
  }

  // Render LaTex from the model node.
  Mp.toLaTex = function toLaTex(node) {
    return render(node);
  }

  var OpStr = {
    ADD: "+",
    SUB: "-",
    MUL: "times",
    DIV: "div",
    FRAC: "frac",
    EQL: "=",
    ATAN2: "atan2",
    SQRT: "sqrt",
    VEC: "vec",
    PM: "pm",
    SIN: "sin",
    COS: "cos",
    TAN: "tan",
    SEC: "sec",
    COT: "cot",
    CSC: "csc",
    ARCSIN: "arcsin",
    ARCCOS: "arccos",
    ARCTAN: "arctan",
    LOG: "log",
    LN: "ln",
    LG: "lg",
    VAR: "var",
    NUM: "num",
    CST: "cst",
    COMMA: ",",
    POW: "^",
    SUBSCRIPT: "_",
    ABS: "abs",
    PAREN: "()",
    HIGHLIGHT: "hi",
    LT: "lt",
    LE: "le",
    GT: "gt",
    GE: "ge",
    NE: "ne",
    APPROX: "approx",
    INTERVAL: "interval",
    LIST: "list",
    EXISTS: "exists",
    IN: "in",
    FORALL: "forall",
    LIM: "lim",
    EXP: "exp",
    TO: "to",
    SUM: "sum",
    INT: "int",
    PROD: "prod",
    PERCENT: "%",
    M: "M",
    RIGHTARROW: "->",
    FACT: "fact",
    BINOM: "binom",
    ROW: "row",
    COL: "col",
    COLON: "colon",
    MATRIX: "matrix",
    FORMAT: "format",
    OVERSET: "overset",
    UNDERSET: "underset",
    OVERLINE: "overline",
    DEGREE: "degree",
    BACKSLASH: "backslash",
    MATHBF: "mathbf",
    NONE: "none"
  };

  forEach(keys(OpStr), function (v, i) {
    Model[v] = OpStr[v];
  });

  var OpToLaTeX = {};
  OpToLaTeX[OpStr.ADD] = "+";
  OpToLaTeX[OpStr.SUB] = "-";
  OpToLaTeX[OpStr.MUL] = "\\times";
  OpToLaTeX[OpStr.DIV] = "\\div";
  OpToLaTeX[OpStr.FRAC] = "\\frac";
  OpToLaTeX[OpStr.EQL] = "=";
  OpToLaTeX[OpStr.ATAN2] = "\\atan2";
  OpToLaTeX[OpStr.POW] = "^";
  OpToLaTeX[OpStr.SUBSCRIPT] = "_";
  OpToLaTeX[OpStr.PM] = "\\pm";
  OpToLaTeX[OpStr.SIN] = "\\sin";
  OpToLaTeX[OpStr.COS] = "\\cos";
  OpToLaTeX[OpStr.TAN] = "\\tan";
  OpToLaTeX[OpStr.ARCSIN] = "\\arcsin";
  OpToLaTeX[OpStr.ARCCOS] = "\\arccos";
  OpToLaTeX[OpStr.ARCTAN] = "\\arctan";
  OpToLaTeX[OpStr.SEC] = "\\sec";
  OpToLaTeX[OpStr.COT] = "\\cot";
  OpToLaTeX[OpStr.CSC] = "\\csc";
  OpToLaTeX[OpStr.LN] = "\\ln";
  OpToLaTeX[OpStr.COMMA] = ",";
  OpToLaTeX[OpStr.M] = "\\M";
  OpToLaTeX[OpStr.BINOM] = "\\binom";
  OpToLaTeX[OpStr.COLON] = "\\colon";

  Model.fold = function fold(node, env) {
    var args = [], val;
    forEach(node.args, function (n) {
      args.push(fold(n, env));
    });
    node.args = args;
    switch (node.op) {
    case OpStr.VAR:
      if ((val = env[node.args[0]])) {
        node = val;  // Replace var node with its value.
      }
      break;
    default:
      // Nothing to fold.
      break;
    }
    return node;
  }

  // Render an AST to LaTex
  var render = function render(n) {
    var text = "";
    if (typeof n === "string") {
      text = n;
    } else if (typeof n === "number") {
      text = n;
    } else if (typeof n === "object") {
      // render sub-expressions
      var args = [];
      for (var i = 0; i < n.args.length; i++) {
        args[i] = render(n.args[i]);
      }
      // render operator
      switch (n.op) {
      case OpStr.VAR:
      case OpStr.CST:
      case OpStr.NUM:
        text = n.args[0];
        break;
      case OpStr.SUB:
        if (n.args.length===1) {
          text = OpToLaTeX[n.op] + " " + args[0];
        }
        else {
          text = args[0] + " " + OpToLaTeX[n.op] + " " + args[1];
        }
        break;
      case OpStr.DIV:
      case OpStr.PM:
      case OpStr.EQL:
        text = args[0] + " " + OpToLaTeX[n.op] + " " + args[1];
        break;
      case OpStr.POW:
        // if subexpr is lower precedence, wrap in parens
        var lhs = n.args[0];
        var rhs = n.args[1];
        if ((lhs.args && lhs.args.length===2) || (rhs.args && rhs.args.length===2)) {
          if (lhs.op===OpStr.ADD || lhs.op===OpStr.SUB ||
            lhs.op===OpStr.MUL || lhs.op===OpStr.DIV ||
            lhs.op===OpStr.SQRT) {
            args[0] = " (" + args[0] + ") ";
          }
        }
        text = "{" + args[0] + "^{" + args[1] + "}}";
        break;
      case OpStr.SIN:
      case OpStr.COS:
      case OpStr.TAN:
      case OpStr.ARCSIN:
      case OpStr.ARCCOS:
      case OpStr.ARCTAN:
      case OpStr.SEC:
      case OpStr.COT:
      case OpStr.CSC:
      case OpStr.LN:
      case OpStr.M:
        text = "{"+ OpToLaTeX[n.op] + "{" + args[0] + "}}";
        break;
      case OpStr.FRAC:
        text = "\\dfrac{" + args[0] + "}{" + args[1] + "}";
        break;
      case OpStr.BINOM:
        text = "\\binom{" + args[0] + "}{" + args[1] + "}";
        break;
      case OpStr.SQRT:
        switch (args.length) {
        case 1:
          text = "\\sqrt{" + args[0] + "}";
          break;
        case 2:
          text = "\\sqrt[" + args[0] + "]{" + args[1] + "}";
          break;
        }
        break;
      case OpStr.VEC:
        text = "\\vec{" + args[0] + "}";
        break;
      case OpStr.MUL:
        // if subexpr is lower precedence, wrap in parens
        var prevTerm;
        text = "";
        forEach(n.args, function (term, index) {
          if (term.args && (term.args.length >= 2)) {
            if (term.op===OpStr.ADD || term.op===OpStr.SUB) {
              args[index] = "(" + args[index] + ")";
            }
            if (index !== 0 && typeof term === "number") {
              text += OpToLaTeX[n.op] + " ";
            }
            text += args[index];
          }
          // elide the times symbol if rhs is parenthesized or a var, or lhs is a number
          // and rhs is not a number
          else if (term.op===OpStr.PAREN ||
               term.op===OpStr.VAR ||
               term.op===OpStr.CST ||
               typeof prevTerm === "number" && typeof term !== "number") {
            text += args[index];
          }
          else {
            if (index !== 0) {
              text += " " + OpToLaTeX[n.op] + " ";
            }
            text += args[index];
          }
          prevTerm = term;
        });
        break;
      case OpStr.ADD:
      case OpStr.COMMA:
        forEach(args, function (value, index) {
          if (index===0) {
            text = value;
          }
          else {
            text = text + " "+ OpToLaTeX[n.op] + " " + value;
          }
        });
        break;
      default:
        assert(false, "unimplemented eval operator");
        break;
      }
    }
    else {
      assert(false, "invalid expression type");
    }

    return text;
  }

  var parse = function parse(src, env) {
    // Define lexical tokens
    var TK_NONE = 0;
    var TK_ADD = '+'.charCodeAt(0);
    var TK_CARET = '^'.charCodeAt(0);
    var TK_UNDERSCORE = '_'.charCodeAt(0);
    var TK_COS = 0x105;
    var TK_COT = 0x108;
    var TK_CSC = 0x109;
    var TK_FRAC = 0x100;
    var TK_SLASH = '/'.charCodeAt(0);
    var TK_EQL = '='.charCodeAt(0);
    var TK_LN = 0x107;
    var TK_LEFTBRACE = '{'.charCodeAt(0);
    var TK_VERTICALBAR = '|'.charCodeAt(0);
    var TK_LEFTBRACKET = '['.charCodeAt(0);
    var TK_LEFTPAREN = '('.charCodeAt(0);
    var TK_MUL = '*'.charCodeAt(0);
    var TK_NUM = '0'.charCodeAt(0);
    var TK_PM = 0x102;
    var TK_RIGHTBRACE = '}'.charCodeAt(0);
    var TK_RIGHTBRACKET = ']'.charCodeAt(0);
    var TK_RIGHTPAREN = ')'.charCodeAt(0);
    var TK_SEC = 0x106;
    var TK_SIN = 0x103;
    var TK_SQRT = 0x101;
    var TK_SUB = '-'.charCodeAt(0);
    var TK_TAN = 0x104;
    var TK_VAR = 'a'.charCodeAt(0);
    var TK_CONST = 'A'.charCodeAt(0);
    var TK_NEXT = 0x10A;
    var TK_COMMA = ','.charCodeAt(0);
    var TK_LG = 0x10B;
    var TK_LOG = 0x10C;
    var TK_TEXT = 0x10D;
    var TK_LT = 0x10E;
    var TK_LE = 0x10F;
    var TK_GT = 0x110;
    var TK_GE = 0x111;
    var TK_EXISTS = 0x112;
    var TK_IN = 0x113;
    var TK_FORALL = 0x114;
    var TK_LIM = 0x115;
    var TK_EXP = 0x116;
    var TK_TO = 0x117;
    var TK_SUM = 0x118;
    var TK_INT = 0x119;
    var TK_PROD = 0x11A;
    var TK_PERCENT = '%'.charCodeAt(0);
    var TK_M = 0x11B;
    var TK_RIGHTARROW = 0x11C;
    var TK_BANG = '!'.charCodeAt(0);
    var TK_BINOM = 0x11D;
    var TK_NEWROW = 0x11E;
    var TK_NEWCOL = 0x11F;
    var TK_BEGIN = 0x120;
    var TK_END = 0x121;
    var TK_COLON = ':'.charCodeAt(0);
    var TK_VEC = 0x122;
    var TK_ARCSIN = 0x123;
    var TK_ARCCOS = 0x124;
    var TK_ARCTAN = 0x125;
    var TK_DIV = 0x126;
    var TK_FORMAT = 0x127;
    var TK_OVERLINE = 0x128;
    var TK_OVERSET = 0x129;
    var TK_UNDERSET = 0x12A;
    var TK_BACKSLASH = 0x12B;
    var TK_MATHBF = 0x12C;
    var TK_NE = 0x12D;
    var TK_APPROX = 0x12E;
    var TK_ABS = 0x12F;
    var T0 = TK_NONE, T1 = TK_NONE;
    // Define mapping from token to operator
    var tokenToOperator = {};
    tokenToOperator[TK_SLASH] = OpStr.FRAC;
    tokenToOperator[TK_FRAC] = OpStr.FRAC;
    tokenToOperator[TK_SQRT] = OpStr.SQRT;
    tokenToOperator[TK_VEC] = OpStr.VEC;
    tokenToOperator[TK_ADD] = OpStr.ADD;
    tokenToOperator[TK_SUB] = OpStr.SUB;
    tokenToOperator[TK_PM] = OpStr.PM;
    tokenToOperator[TK_CARET] = OpStr.POW;
    tokenToOperator[TK_UNDERSCORE] = OpStr.SUBSCRIPT;
    tokenToOperator[TK_MUL] = OpStr.MUL;
    tokenToOperator[TK_DIV] = OpStr.DIV;
    tokenToOperator[TK_SIN] = OpStr.SIN;
    tokenToOperator[TK_COS] = OpStr.COS;
    tokenToOperator[TK_TAN] = OpStr.TAN;
    tokenToOperator[TK_ARCSIN] = OpStr.ARCSIN;
    tokenToOperator[TK_ARCCOS] = OpStr.ARCCOS;
    tokenToOperator[TK_ARCTAN] = OpStr.ARCTAN;
    tokenToOperator[TK_SEC] = OpStr.SEC;
    tokenToOperator[TK_COT] = OpStr.COT;
    tokenToOperator[TK_CSC] = OpStr.CSC;
    tokenToOperator[TK_LN] = OpStr.LN;
    tokenToOperator[TK_LG] = OpStr.LG;
    tokenToOperator[TK_LOG] = OpStr.LOG;
    tokenToOperator[TK_EQL] = OpStr.EQL;
    tokenToOperator[TK_COMMA] = OpStr.COMMA;
    tokenToOperator[TK_TEXT] = OpStr.TEXT;
    tokenToOperator[TK_LT] = OpStr.LT;
    tokenToOperator[TK_LE] = OpStr.LE;
    tokenToOperator[TK_GT] = OpStr.GT;
    tokenToOperator[TK_GE] = OpStr.GE;
    tokenToOperator[TK_NE] = OpStr.NE;
    tokenToOperator[TK_APPROX] = OpStr.APPROX;
    tokenToOperator[TK_EXISTS] = OpStr.EXISTS;
    tokenToOperator[TK_IN] = OpStr.IN;
    tokenToOperator[TK_FORALL] = OpStr.FORALL;
    tokenToOperator[TK_LIM] = OpStr.LIM;
    tokenToOperator[TK_EXP] = OpStr.EXP;
    tokenToOperator[TK_TO] = OpStr.TO;
    tokenToOperator[TK_SUM] = OpStr.SUM;
    tokenToOperator[TK_INT] = OpStr.INT;
    tokenToOperator[TK_PROD] = OpStr.PROD;
    tokenToOperator[TK_M] = OpStr.M;
    tokenToOperator[TK_RIGHTARROW] = OpStr.RIGHTARROW;
    tokenToOperator[TK_BANG] = OpStr.FACT;
    tokenToOperator[TK_BINOM] = OpStr.BINOM;
    tokenToOperator[TK_NEWROW] = OpStr.ROW;
    tokenToOperator[TK_NEWCOL] = OpStr.COL;
    tokenToOperator[TK_COLON] = OpStr.COLON;
    tokenToOperator[TK_FORMAT] = OpStr.FORMAT;
    tokenToOperator[TK_OVERLINE] = OpStr.OVERLINE;
    tokenToOperator[TK_OVERSET] = OpStr.OVERSET;
    tokenToOperator[TK_UNDERSET] = OpStr.UNDERSET;
    tokenToOperator[TK_BACKSLASH] = OpStr.BACKSLASH;
    tokenToOperator[TK_MATHBF] = OpStr.MATHBF;

    function newNode(op, args) {
      return {
        op: op,
        args: args
      };
    }

    function matchThousandsSeparator(ch, last) {
      // Check separator and return if there is a match.
      if (Model.option("allowThousandsSeparator") || Model.option("setThousandsSeparator")) {
        var separators = Model.option("setThousandsSeparator");
        if (!separators) {
          // Use defaults.
          return ch === ',' ? ch : '';
        } else {
          // If the character matches the last separator or, if not, last is undefiend
          // and character is in the provided list, return the character.
          if (ch === last || !last && indexOf(separators, ch) >= 0) {
            return ch;
          } else {
            return "";
          }
        }
      }
      // Not allowed. Will be treated as punctuation of some other kind.
      return '';
    }

    function getDecimalSeparator() {
      // We use the thousands separator to determine the conventional decimal
      // separator. If TS is ',' then DS is '.', otherwise DS is ','.
      var decimalSeparator = Model.option("setDecimalSeparator");
      var thousandsSeparators = Model.option("setThousandsSeparator");
      if (typeof decimalSeparator === "string") {
        assert(decimalSeparator.length === 1, message(1002));
        var separator = decimalSeparator;
        if (thousandsSeparators instanceof Array &&
            indexOf(thousandsSeparators, separator) >= 0) {
          // There is a conflict between the decimal separator and the
          // thousands separator.
          assert(false, message(2008, [separator]));
          return '.';
        }
        return separator;
      } 
      if (thousandsSeparators instanceof Array && indexOf(thousandsSeparators, '.') >= 0) {
        // Period is used as a thousands separator, so cannot be used as a
        // decimal separator.
        assert(false, message(2008));
        return '.';
      }
      // Otherwise, period is used as the decimal separator.
      return ".";
    }

    // Construct a number node.
    function numberNode(n0, doScale, roundOnly) {
      // doScale - scale n if true
      // roundOnly - only scale if rounding
      var ignoreTrailingZeros = Model.option("ignoreTrailingZeros");
      var n1 = n0.toString();
      var n2 = "";
      var i, ch;
      var lastSeparatorIndex, lastSignificantIndex;
      var separatorCount = 0;
      var numberFormat = "integer";
      var hasLeadingZero, hasTrailingZero;
      if (n0 === ".") {
        assert(false, message(1004, [n0, n0.charCodeAt(0)]));
      }
      for (i = 0; i < n1.length; i++) {
        if (matchThousandsSeparator(ch = n1.charAt(i))) {
          if (separatorCount && lastSeparatorIndex !== i - 4 ||
              !separatorCount && i > 4) {
            assert(false, message(1005));
          }
          lastSeparatorIndex = i;
          separatorCount++;
          // We erase separators so 1,000 and 1000 are equivLiteral.
        } else {
          if (ch === getDecimalSeparator()) {
            ch = '.';  // Convert to character the BigDecimal agrees with.
            if (numberFormat === "decimal") {
              assert(false, message(1007, [getDecimalSeparator(), n2 + getDecimalSeparator()]));
            }
            numberFormat = "decimal";
            if (separatorCount && lastSeparatorIndex !== i - 4) {
              assert(false, message(1005));
            }
            if (n2 === "0") {
              hasLeadingZero = true;
            }
            // Don't count the decimal point as significant so that 2.0 and 2 are equiv.
            lastSignificantIndex = i - 1;
          } else if (numberFormat === "decimal") {
            if (ch !== "0") {
              lastSignificantIndex = i - separatorCount;
            }
          }
          n2 += ch;
        }
      }
      if (numberFormat !== "decimal" && lastSeparatorIndex && lastSeparatorIndex !== i - 4) {
        // If we haven't seen a decimal separator, then make sure the last thousands
        // separator is in the right place.
        assert(false, message(1005));
      }
      if (lastSignificantIndex !== undefined) {
        if (lastSignificantIndex + 1 < n2.length) {
          hasTrailingZero = true;
        }
        if (ignoreTrailingZeros) {
          n2 = n2.substring(0, lastSignificantIndex + 1);
        }
      }
      n2 = new BigDecimal(n2);   // Normalize representation
      if (doScale) {
        var scale = option("decimalPlaces")
        if (!roundOnly || n2.scale() > scale) {
          n2 = n2.setScale(scale, BigDecimal.ROUND_HALF_UP);
        }
      }
      return {
        op: Model.NUM,
        args: [String(n2)],
        hasThousandsSeparator: separatorCount !== 0,
        numberFormat: numberFormat,
        hasLeadingZero: hasLeadingZero,
        hasTrailingZero: hasTrailingZero
      }
    }
    // Construct a multiply node.
    function multiplyNode(args, flatten) {
      return binaryNode(Model.MUL, args, flatten);
    }
    // Construct a unary node.
    function unaryNode(op, args) {
      assert(args.length === 1, "Wrong number of arguments for unary node");
      return newNode(op, args);
    }
    // Construct a binary node.
    function binaryNode(op, args, flatten) {
      assert(args.length > 1, "Too few argument for binary node");
      var aa = [];
      forEach(args, function(n) {
        if (flatten && n.op === op) {
          aa = aa.concat(n.args);
        } else {
          aa.push(n);
        }
      });
      return newNode(op, aa);
    }

    var nodeOne = numberNode("1");
    var nodeMinusOne = numberNode("-1");
    var nodeNone = newNode(Model.NONE, [numberNode("0")]);

    //
    // PARSER
    //
    // Manage the token stream.
    var scan = scanner(src);
    // Prime the token stream.
    function start(options) {
      T0 = scan.start(options);
    }
    // Get the current token.
    function hd() {
      return T0;
    }
    // Get the current lexeme.
    function lexeme() {
      return scan.lexeme();
    }
    // Advance the next token.
    function next(options) {
      T0 = T1;
      T1 = TK_NONE;
      if (T0 === TK_NONE) {
        T0 = scan.start(options);
      }
    }
    function lookahead(options) {
      if (T1 === TK_NONE) {
        T1 = scan.start(options);
      }
      return T1;
    }
    // Consume the current token if it matches, otherwise throw.
    function eat(tc, options) {
      var tk = hd();
      if (tk !== tc) {
        var expected = String.fromCharCode(tc);
        var found = tk ? String.fromCharCode(tk) : "EOS";
        assert(false, message(1001, [expected, found]));
      }
      next(options);
    }
    // Begin parsing functions.
    function primaryExpr() {
      var e;
      var tk;
      var op;
      switch ((tk=hd())) {
      case 'A'.charCodeAt(0):
      case 'a'.charCodeAt(0):
      case TK_VAR:
        var args = [lexeme()];
        next();
        // Collect the subscript if there is one. Subscripts make multipart variable names.
        if ((t=hd())===TK_UNDERSCORE) {
          next({oneCharToken: true});
          args.push(primaryExpr());   // {op:VAR, args:["Fe", "2"]}
        }
        e = newNode(Model.VAR, args);
        if (isChemCore()) {
          if (hd() === TK_LEFTBRACE && lookahead() === TK_RIGHTBRACE) {
            // C_2{}^3 -> C_2^3
            eat(TK_LEFTBRACE);
            eat(TK_RIGHTBRACE);
          }
        }
        break;
      case TK_NUM:
        e = numberNode(lexeme());
        next();
        break;
      case TK_LEFTBRACKET:
      case TK_LEFTPAREN:
        e = parenExpr(tk);
        break;
      case TK_LEFTBRACE:
        e = braceExpr();
        break;
      case TK_BEGIN:
        next();
        var figure = braceExpr();
        var tbl = matrixExpr();
        eat(TK_END);
        braceExpr();
        if (indexOf(figure.args[0], "matrix") >= 0) {
          e = newNode(Model.MATRIX, [tbl]);
        } else {
          assert(false, "Unrecognized LaTeX name");
        }
        break;
      case TK_VERTICALBAR:
        e = absExpr();
        break;
      case TK_ABS:
        next();
        var e = additiveExpr();
        return unaryNode(Model.ABS, [e]);
        break;
      case TK_FRAC:
        next();
        var expr1 = braceExpr();
        var expr2 = braceExpr();
        e = newNode(Model.FRAC, [expr1, expr2]);
        e.isFraction = true;
        break;
      case TK_BINOM:
        next();
        var n = braceExpr();
        var k = braceExpr();
        // (n k) = \frac{n!}{k!(n-k)!}
        var num = unaryNode(Model.FACT, [n]);
        var den = binaryNode(Model.POW, [
          binaryNode(Model.MUL, [
            unaryNode(Model.FACT, [k]),
            unaryNode(Model.FACT, [binaryNode(Model.ADD, [n, negate(k)])])
          ]),
          nodeMinusOne
        ]);
        e = binaryNode(Model.MUL, [num, den]);
        e.isBinomial = true;
        break;
      case TK_SQRT:
        next();
        switch(hd()) {
        case TK_LEFTBRACKET:
          var root = bracketExpr();
          var base = braceExpr();
          e = newNode(Model.POW, [base, newNode(Model.POW, [root, nodeMinusOne])]);
          break;
        case TK_LEFTBRACE:
          var base = braceExpr();
          e = newNode(Model.POW, [base, newNode(Model.POW, [newNode(Model.NUM, ["2"]), nodeMinusOne])]);
          break;
        default:
          assert(false, message(1001, ["{ or (", String.fromCharCode(hd())]));
          break;
        }
        break;
      case TK_VEC:
        next();
        var name = braceExpr();
        e = newNode(Model.VEC, [name]);
        break;
      case TK_SIN:
      case TK_COS:
      case TK_TAN:
        next();
        var t, args = [];
        // Collect exponents if there are any
        while ((t=hd())===TK_CARET) {
          next({oneCharToken: true});
          args.push(unaryExpr());
        }

        if (args.length === 1 && args[0].op === Model.NUM && args[0].args[0] === "-1") {
          // Special case for sin^{-1} and friends.
          op = "arc" + tokenToOperator[tk];
          args = [];
        } else {
          op = tokenToOperator[tk];
        }
        args.unshift(newNode(op, [primaryExpr()]));
        if (args.length > 1) {
          return newNode(Model.POW, args);
        } else {
          return args[0];
        }
        break;
      case TK_ARCSIN:
      case TK_ARCCOS:
      case TK_ARCTAN:
      case TK_SEC:
      case TK_COT:
      case TK_CSC:
        next();
        var t, args = [];
        // Collect exponents if there are any
        while ((t=hd())===TK_CARET) {
          next({oneCharToken: true});
          args.push(unaryExpr());
        }
        args.unshift(newNode(tokenToOperator[tk], [primaryExpr()]));
        if (args.length > 1) {
          return newNode(Model.POW, args);
        } else {
          return args[0];
        }
        break;
      case TK_LN:
        next();
        return newNode(Model.LOG, [newNode(Model.VAR, ["e"]), primaryExpr()]);
      case TK_LG:
        next();
        return newNode(Model.LOG, [newNode(Model.NUM, ["10"]), primaryExpr()]);
      case TK_LOG:
        next();
        var t, args = [];
        // Collect the subscript if there is one
        if ((t=hd())===TK_UNDERSCORE) {
          next({oneCharToken:true});
          args.push(primaryExpr());
        } else {
          args.push(newNode(Model.VAR, ["e"]));    // default to natural log
        }
        args.push(primaryExpr());
        // Finish the log function
        return newNode(Model.LOG, args);
        break;
      case TK_LIM:
        next();
        var t, args = [];
        // Collect the subscript and expression
        eat(TK_UNDERSCORE);
        args.push(primaryExpr());
        args.push(primaryExpr());
        // Finish the log function
        return newNode(tokenToOperator[tk], args);
        break;
      case TK_SUM:
      case TK_INT:
      case TK_PROD:
        next();
        var t, args = [];
        // Collect the subscript and expression
        if (hd() === TK_UNDERSCORE) {
          next({oneCharToken: true});
          args.push(primaryExpr());
          eat(TK_CARET, {oneCharToken: true});              // If we have a subscript, then we expect a superscript
          args.push(primaryExpr());
        }
        args.push(commaExpr());
        // Finish the log function
        return newNode(tokenToOperator[tk], args);
        break;
      case TK_EXISTS:
        next();
        return newNode(Model.EXISTS, [equalExpr()]);
      case TK_FORALL:
        next();
        return newNode(Model.FORALL, [commaExpr()]);
      case TK_EXP:
        next();
        return newNode(Model.EXP, [additiveExpr()]);
      case TK_M:
        next();
        return newNode(Model.M, [multiplicativeExpr()]);
      case TK_FORMAT:
        next();
        return newNode(Model.FORMAT, [braceExpr()]);
      case TK_OVERLINE:
        next();
        return newNode(Model.OVERLINE, [braceExpr()]);
      case TK_OVERSET:
      case TK_UNDERSET:
        next();
        var expr1 = braceExpr();
        var expr2 = braceExpr();
        // Add the annotation to the variable.
        expr2.args.push(newNode(tokenToOperator[tk], [expr1]));
        return expr2;
        break;
      case TK_MATHBF:
        // Erase this token.
        next();
        var expr1 = braceExpr();
        return expr1;
      default:
        assert(false, message(1006, [lexeme()]));
        e = void 0;
        break;
      }
      return e;
    }
    // Parse '1 & 2 & 3 \\ a & b & c'
    function matrixExpr( ) {
      var args = [];
      var node, t;
      args.push(rowExpr());
      while ((t = hd()) === TK_NEWROW) {
        next();
        args.push(rowExpr());
      }
      return newNode(tokenToOperator[TK_NEWROW], args);
    }
    // Parse '1 & 2 & 3'
    function rowExpr( ) {
      var args = [];
      var t;
      args.push(equalExpr());
      while ((t = hd()) === TK_NEWCOL) {
        next();
        args.push(equalExpr());
      }
      return newNode(tokenToOperator[TK_NEWCOL], args);
    }
    // Parse '| expr |'
    function absExpr() {
      eat(TK_VERTICALBAR);
      var e = additiveExpr();
      eat(TK_VERTICALBAR);
      return unaryNode(Model.ABS, [e]);
    }
    // Parse '{ expr }'
    function braceExpr() {
      var e;
      eat(TK_LEFTBRACE);
      if (hd() === TK_RIGHTBRACE) {
        eat(TK_RIGHTBRACE);
        e = newNode(Model.COMMA, []);
      } else {
        e = commaExpr();
        eat(TK_RIGHTBRACE);
      }
      e.lbrk = TK_LEFTBRACE;
      e.rbrk = TK_RIGHTBRACE;
      return e;
    }
    // Parse '[ expr ]'
    function bracketExpr() {
      eat(TK_LEFTBRACKET);
      var e = commaExpr();
      eat(TK_RIGHTBRACKET);
      return e;
    }
    // Parse '( expr )' and '( expr ]' and '[ expr )' and '[ expr ]'
    function parenExpr(tk) {
      // Handle grouping and intervals.
      var e;
      var tk2;
      eat(tk);
      if (hd() === TK_RIGHTPAREN || hd() === TK_RIGHTBRACKET) {
        eat(tk === TK_LEFTPAREN ? TK_RIGHTPAREN : TK_RIGHTBRACKET);
        e = newNode(Model.COMMA, []);
      } else {
        e = commaExpr();
        if (Model.option("allowInterval")) {
          // (..], [..], [..), (..)
          eat(tk2 = hd() === TK_RIGHTPAREN ? TK_RIGHTPAREN : TK_RIGHTBRACKET);
        } else {
          // (..), [..]
          eat(tk2 = tk === TK_LEFTPAREN ? TK_RIGHTPAREN : TK_RIGHTBRACKET);
        }
      }
      // Save the brackets as attributes on the node for later use.
      e.lbrk = tk;
      e.rbrk = tk2;
      // intervals: (1, 3), [1, 3], [1, 3), (1, 3]
      if (Model.option("allowInterval") && e.args.length === 2 &&
          (tk === TK_LEFTPAREN || tk === TK_LEFTBRACKET) &&
          (tk2 === TK_RIGHTPAREN || tk2 === TK_RIGHTBRACKET)) {
        e.op = Model.INTERVAL;
      } else if (e.op === Model.COMMA) {
        e.op = Model.LIST;
      }
      return e;
    }
    // Parse 'x^2'
    function exponentialExpr() {
      var t, args = [primaryExpr()];
      while ((t=hd())===TK_CARET) {
        next({oneCharToken: true});
        var t;
        if ((isMathSymbol(args[0]) || isChemCore()) &&
            ((t = hd()) === TK_ADD || t === TK_SUB)) {
          next();
          // Na^+
          args.push(unaryNode(tokenToOperator[t], [nodeOne]));
        } else {
          var n = unaryExpr();
          if (n.op === Model.VAR && n.args[0] === "\\circ") {
            // 90^{\circ} -> degree 90
            if (hd() === TK_VAR &&
                lexeme() === "K" || lexeme() === "C" || lexeme() === "F") {
              n = multiplyNode([
                args.pop(),
                unaryNode(Model.VAR, ["\\degree " + lexeme()])]);
              next();
            } else {
              n = multiplyNode([
                args.pop(),
                unaryNode(Model.VAR, ["\\degree"])
              ]);
            }
            args.push(n);
          } else {
            // x^2
            args.push(n);
          }
        }
      }
      if (args.length > 1) {
        return newNode(Model.POW, args);
      } else {
        return args[0];
      }
    }
    // Parse '10%', '4!'
    function postfixExpr() {
      var t;
      var expr = exponentialExpr();
      switch (t = hd()) {
      case TK_PERCENT:
        next();
        expr = newNode(Model.PERCENT, [expr]);
        break;
      case TK_BANG:
        next();
        expr = newNode(Model.FACT, [expr]);
        break;
      default:
        if (t === TK_VAR && lexeme() === "\\degree") {
          next();
          if (hd() === TK_VAR && (lexeme() === "K" || lexeme() === "C" || lexeme() === "F")) {
            expr = multiplyNode([
              expr,
              unaryNode(Model.VAR, ["\\degree " + lexeme()])]);
            next();
          } else {
            expr = multiplyNode([
              expr,
              unaryNode(Model.VAR, ["\\degree"])
            ]);
          }
        } else if (isChemCore() && (t === TK_ADD || t === TK_SUB) && lookahead() === TK_RIGHTBRACE) {
          next();
          // 3+, ion
          expr = unaryNode(tokenToOperator[t], [expr]);
        } // Otherwise we're in the middle of a binary expr.
        break;
      }
      return expr;
    }
    // Parse '+x', '\pm y'
    function unaryExpr() {
      var t;
      var expr;
      switch (t = hd()) {
      case TK_ADD:
        next();
        expr = unaryExpr();
        break;
      case TK_SUB:
        next();
        expr = negate(unaryExpr());
        break;
      case TK_PM:
        next();
        expr = unaryExpr();
        expr = newNode(tokenToOperator[t], [expr]);
        break;
      case TK_UNDERSCORE:
        // _1, _1^2, _+^-
        var op = tokenToOperator[t];
        next({oneCharToken: true});
        if ((t = hd()) === TK_ADD || t === TK_SUB) {
          next();
          // ^+, ^-
          expr = nodeOne;
        } else {
          expr = unaryExpr();
        }
        expr = newNode(op, [expr]);
        if (hd() === TK_CARET) {
          // _1, _1^2, _+^-
          var op = tokenToOperator[t];
          next({oneCharToken: true});
          if ((t = hd()) === TK_ADD || t === TK_SUB) {
            next();
            // ^+, ^-
            expr = nodeOne;
          } else {
            expr = unaryExpr();
          }
          expr = newNode(op, [expr]);
        }
        break;      
      case TK_CARET:
        var op = tokenToOperator[t];
        next({oneCharToken: true});
        if ((t = hd()) === TK_ADD || t === TK_SUB) {
          next();
          // ^+, ^-
          expr = nodeOne;
        } else {
          expr = unaryExpr();
        }
        expr = newNode(op, [expr]);
        break;      
      default:
        if (t === TK_VAR && lexeme() === "$") {
          next();
          if (hd()) {
            // Give $1 a higher precedence than ordinary multiplication.
            expr = multiplyNode([newNode(Model.VAR, ["$"]), postfixExpr()]);
          } else {
            // Standalone "$". Probably not useful but we had a test case for it.
            expr = newNode(Model.VAR, ["$"]);
          }
        } else {
          expr = postfixExpr();
        }
        break;
      }
      return expr;
    }
    // Parse 'x_2'
    function subscriptExpr() {
      var t, args = [unaryExpr()];
      if ((t=hd())===TK_UNDERSCORE) {
        next({oneCharToken: true});
        args.push(unaryExpr());
        if (isChemCore()) {
          if (hd() === TK_LEFTBRACE) {
            // C_2{}^3 -> C_2^3
            eat(TK_LEFTBRACE);
            eat(TK_RIGHTBRACE);
          }
        }
      }
      if (args.length > 1) {
        return newNode(Model.SUBSCRIPT, args);
      } else {
        return args[0];
      }
    }
    // Parse '1/2/3/4'
    function fractionExpr() {
      var t, node = subscriptExpr();
      while ((t=hd())===TK_SLASH) {
        next();
        node = newNode(Model.FRAC, [node, subscriptExpr()]);
        node.isFraction = true;
      }
      return node;
    }
    //
    function isChemSymbol(n) {
      var id;
      if (n.op === Model.VAR) {
        id = n.args[0];
      } else if (n.op === Model.POW) {
        id = n.args[0].args[0];
      } else {
        return false;
      }
      var sym = Model.env[id];
      return sym && sym.mass ? true : false;   // Has mass so must be (?) a chem symbol.
    }
    //
    function isMathSymbol(n) {
      if (n.op !== Model.VAR) {
        return false;
      }
      var sym = Model.env[n.args[0]];
      return sym && sym.name ? true : false;    // This is somewhat ad hoc, update as needed
    }
    //
    function isVar(n, id) {
      assert(typeof id === "undefined" || typeof id === "string", "Internal error in 'isVar()'");
      if (n.op !== Model.VAR) {
        return false;
      }
      return n === undefined ? true : n.args[0] === id;
    }
    // Parse 'a \times b', 'a * b'
    function multiplicativeExpr() {
      var t, expr, explicitOperator = false, prevExplicitOperator, isFraction, args = [];
      expr = fractionExpr();
      if (expr.op === Model.MUL && !expr.isBinomial) {
        // FIXME binomials and all other significant syntax should not be desugared
        // during parsing. It breaks equivLiteral and equivSyntax.
        args = expr.args;
      } else {
        args = [expr];
      }
      // While lookahead is not a lower precedent operator
      // FIXME need a better way to organize this condition
      while((t = hd()) && !isAdditive(t) && !isRelational(t) &&
            t !== TK_COMMA && !isEquality(t) && t !== TK_RIGHTBRACE &&
            t !== TK_RIGHTPAREN && t !== TK_RIGHTBRACKET &&
            t !== TK_RIGHTARROW && t !== TK_LT && t !== TK_VERTICALBAR &&
            t !== TK_NEWROW && t !== TK_NEWCOL && t !== TK_END) {
        prevExplicitOperator = explicitOperator;  // In case we need to backup one operator
        explicitOperator = false;
        if (isMultiplicative(t)) {
          next();
          explicitOperator = true;
        }
        expr = fractionExpr();
        if (t === TK_DIV) {
          expr = newNode(Model.POW, [expr, nodeMinusOne]);
        }
        if (isChemCore() && t === TK_LEFTPAREN && isVar(args[args.length-1], "M")) {
          // M(x) -> \M(x)
          args.pop();
          expr = unaryNode(Model.M, [expr]);
        } else if (!explicitOperator && args.length > 0 &&
                   isMixedFraction([args[args.length-1], expr])) {
          // 3 \frac{1}{2} -> 3 + \frac{1}{2}
          t = args.pop();
          if (isNeg(t)) {
            expr = binaryNode(Model.MUL, [nodeMinusOne, expr]);
          }
          expr = binaryNode(Model.ADD, [t, expr]);
          expr.isMixedFraction = true;
        } else if (!explicitOperator && args.length > 0 &&
                   isRepeatingDecimal([args[args.length-1], expr])) {
          // 3.\overline{12} --> 3.0+(0.12, repeating)
          // 0.3\overline{12} --> 0.3+0.1*(.12, repeating)
          var n0 = args.pop();
          var n1 = expr.args[0];
          n1 = numberNode("." + n1.args[0]);
          n1.isRepeating = true;
          if (indexOf(n0.args[0], ".") >= 0) {
            var decimalPlaces = n0.args[0].length - indexOf(n0.args[0], ".")- 1;
            n1 = multiplyNode([n1, binaryNode(Model.POW, [numberNode("10"), numberNode("-" + decimalPlaces)])]);
          }
          expr = binaryNode(Model.ADD, [n0, n1]);
          expr.numberFormat = "decimal";
          expr.isRepeating = true;
        } else if (t === TK_MUL && args.length > 0 && explicitOperator &&
                   isScientific([args[args.length-1], expr])) {
          // 1.2 \times 10 ^ {-3}
          t = args.pop();
          if (isNeg(t)) {
            expr = binaryNode(Model.MUL, [nodeMinusOne, expr]);
          }
          expr = binaryNode(Model.MUL, [t, expr]);
          expr.isScientific = true;
        }
        if (expr.op === Model.MUL &&
            !expr.isScientific &&
            !expr.isBinomial) {
          args = args.concat(expr.args);
        } else {
          args.push(expr);
        }
      }
      if (args.length > 1) {
        return multiplyNode(args);
      } else {
        return args[0];
      }
      //
      function isMultiplicative(t) {
        return t === TK_MUL || t === TK_DIV || t === TK_SLASH; // / is only multiplicative for parsing
      }
    }

    function isNumber(n) {
      return n.op === Model.NUM;
    }

    function isMixedFraction(args) {
      // 3\frac{1}{2} but not 3(\frac{1}{2}) or 3 1.0/2
      if (!args[0].lbrk && !args[1].lbrk &&
          args[0].op === Model.NUM &&
          args[1].op === Model.FRAC &&
          args[0].numberFormat === "integer" &&
          args[1].args[0].op === Model.NUM &&
          args[1].args[0].numberFormat === "integer" &&
          args[1].args[1].op === Model.NUM &&
          args[1].args[1].numberFormat === "integer") {
        return true;
      }
      return false;
    }

    function isRepeatingDecimal(args) {
      // "3." "\overline{..}"
      if (!args[0].lbrk && !args[1].lbrk &&
          args[0].op === Model.NUM &&
          args[0].numberFormat === "decimal" &&
          args[1].op === Model.OVERLINE) {
        return true;
      }
      return false;
    }

    function isScientific(args) {
      if (args.length === 1) {
        // 1.2, 10^2
        if (args[0].op === Model.NUM &&
            (args[0].args[0].length === 1 || indexOf(args[0].args[0], getDecimalSeparator()) === 1)) {
          return true;
        } else if (args[0].op === Model.POW &&
                   args[0].args[0].op === Model.NUM && args[0].args[0].args[0] === "10" &&
                   args[0].args[1].numberFormat === "integer") {
          return true;
        }
        return false;
      } else if (args.length === 2) {
        // 1.0 \times 10 ^ 1
        var a = args[0];
        var e = args[1];
        if (a.op === Model.NUM &&
            (a.args[0].length === 1 || indexOf(a.args[0], getDecimalSeparator()) === 1) &&
            e.op === Model.POW &&
            e.args[0].op === Model.NUM && e.args[0].args[0] === "10" &&
            e.args[1].numberFormat === "integer") {
          return true;
        }
        return false;
      }
    }

    function isNeg(n) {
      if (typeof n === "number") {
        return n < 0;
      } else if (n.args.length===1) {
        return n.op === OpStr.SUB && n.args[0].args[0] > 0 ||  // is unary minus
               n.op === Model.NUM && +n.args[0] < 0;           // is negative number
      } else if (n.args.length===2) {
        return n.op===OpStr.MUL && isNeg(n.args[0]);  // leading term is neg
      }
    }
    // Return the numeric inverse of the argument.
    function negate(n) {
      if (typeof n === "number") {
        return -n;
      } else if (n.op === Model.NUM) {
        if (n.args[0].charAt(0) === "-") {
          return unaryNode(Model.SUB, [n]);
        } else {
          return numberNode("-" + n.args[0]);
        }
      } else if (n.op === Model.MUL) {
        n.args.unshift(negate(n.args.shift()));
        return n;
      }
      return unaryNode(Model.SUB, [n]);
    }
    //
    function isAdditive(t) {
      return t === TK_ADD || t === TK_SUB || t === TK_PM || t === TK_BACKSLASH;
    }
    // Parse 'a + b'
    function additiveExpr() {
      var expr = multiplicativeExpr();
      var t;
      while (isAdditive(t = hd())) {
        next();
        var expr2 = multiplicativeExpr();
        switch(t) {
        case TK_BACKSLASH:
          expr = binaryNode(Model.BACKSLASH, [expr, expr2]);
          break;
        case TK_PM:
          expr = binaryNode(Model.PM, [expr, expr2]);
          break;
        case TK_SUB:
          expr2 = negate(expr2);
          // fall through
        default:
          expr = binaryNode(Model.ADD, [expr, expr2], true /*flatten*/);
          break;
        }
      }
      return expr;
    }
    //
    function isRelational(t) {
      return t === TK_LT || t === TK_LE || t === TK_GT || t === TK_GE ||
             t === TK_IN || t === TK_TO || t === TK_COLON;
    }
    // Parse 'x < y'
    function relationalExpr() {
      var t = hd();
      if (isRelational(t)) {
        // Leading '=' so synthesize a variable.
        var expr = newNode(Model.VAR, ["_"]);
      } else {
        var expr = additiveExpr();
      }
      var args = [];
      while (isRelational(t = hd())) {
        // x < y < z -> [x < y, y < z]
        next();
        if (hd() === 0) {
          // Trailing '=' so synthesize a variable.
          var expr2 = newNode(Model.VAR, ["_"]);
        } else {
          var expr2 = additiveExpr();
        }
        expr = newNode(tokenToOperator[t], [expr, expr2]);
        args.push(expr);
        expr = expr2;
      }
      if (args.length === 0) {
        return expr;
      } else if (args.length === 1) {
        return args[0];
      } else {
        return newNode(Model.COMMA, args);
      }
    }
    // Parse 'x = 10'
    function isEquality(t) {
      return t === TK_EQL || t === TK_NE || t === TK_APPROX;
    }
    function equalExpr() {
      if (isEquality(hd())) {
        // Leading '=' so synthesize a variable.
        var expr = newNode(Model.VAR, ["_"]);
      } else {
        var expr = relationalExpr();
      }
      var t;
      var args = [];
      while (isEquality(t = hd()) || t === TK_RIGHTARROW) {
        // x = y = z -> [x = y, y = z]
        next();
        if (hd() === 0) {
          // Trailing '=' so synthesize a variable.
          var expr2 = newNode(Model.VAR, ["_"]);
        } else {
          var expr2 = additiveExpr();
        }
        expr = newNode(tokenToOperator[t], [expr, expr2]);
        args.push(expr);
        expr = expr2;
      }
      if (args.length === 0) {
        return expr;
      } else if (args.length === 1) {
        return args[0];
      } else {
        return newNode(Model.COMMA, args);
      }
    }
    // Parse 'a, b, c, d'
    function commaExpr( ) {
      var expr = equalExpr();
      var args = [expr];
      var t;
      while ((t = hd())===TK_COMMA) {
        next();
        args.push(equalExpr());
      }
      if (args.length > 1) {
        return newNode(tokenToOperator[TK_COMMA], args);
      } else {
        return expr;
      }
    }
    // Root syntax.
    function expr() {
      start();
      if (hd()) {
        var n = commaExpr();
        if (n.op !== Model.COMMA &&
            n.lbrk === TK_LEFTBRACE &&
            n.rbrk === TK_RIGHTBRACE) {
          // Top level {..} is a set, so make a comma expr.
          n = newNode(Model.COMMA, [n]);
        }
        assert(!hd(), message(1003, [scan.pos(), scan.lexeme()]));
        return n;
      }
      // No meaningful input. Return a dummy node to avoid choking.
      return nodeNone;
    }
    // Return a parser object.
    return {
      expr: expr
    };
    //
    // SCANNER
    //
    // Find tokens in the input stream.
    //
    function scanner(src) {
      var curIndex = 0;
      var lexeme = "";
      var lexemeToToken = {
        "\\cdot": TK_MUL,
        "\\times": TK_MUL,
        "\\div": TK_DIV,
        "\\dfrac": TK_FRAC,
        "\\frac": TK_FRAC,
        "\\sqrt": TK_SQRT,
        "\\vec": TK_VEC,
        "\\pm": TK_PM,
        "\\sin": TK_SIN,
        "\\cos": TK_COS,
        "\\tan": TK_TAN,
        "\\sec": TK_SEC,
        "\\cot": TK_COT,
        "\\csc": TK_CSC,
        "\\arcsin": TK_ARCSIN,
        "\\arccos": TK_ARCCOS,
        "\\arctan": TK_ARCTAN,
        "\\ln": TK_LN,
        "\\lg": TK_LG,
        "\\log": TK_LOG,
        "\\left": null,  // whitespace
        "\\right": null,
        "\\big": null,
        "\\Big": null,
        "\\bigg": null,
        "\\Bigg": null,
        "\\ ": null,
        "\\quad": null,
        "\\qquad": null,
        "\\text": TK_TEXT,
        "\\textrm": TK_TEXT,
        "\\textit": TK_TEXT,
        "\\textbf": TK_TEXT,
        "\\lt": TK_LT,
        "\\le": TK_LE,
        "\\gt": TK_GT,
        "\\ge": TK_GE,
        "\\ne": TK_NE,
        "\\approx": TK_APPROX,
        "\\exists": TK_EXISTS,
        "\\in": TK_IN,
        "\\forall": TK_FORALL,
        "\\lim": TK_LIM,
        "\\exp": TK_EXP,
        "\\to": TK_TO,
        "\\sum": TK_SUM,
        "\\int": TK_INT,
        "\\prod": TK_PROD,
        "\\%": TK_PERCENT,
        "\\rightarrow": TK_RIGHTARROW,
        "\\longrightarrow": TK_RIGHTARROW,
        "\\binom": TK_BINOM,
        "\\begin": TK_BEGIN,
        "\\end": TK_END,
        "\\colon": TK_COLON,
        "\\vert": TK_VERTICALBAR,
        "\\lvert": TK_VERTICALBAR,
        "\\rvert": TK_VERTICALBAR,
        "\\mid": TK_VERTICALBAR,
        "\\format": TK_FORMAT,
        "\\overline": TK_OVERLINE,
        "\\overset": TK_OVERSET,
        "\\underset": TK_UNDERSET,
        "\\backslash": TK_BACKSLASH,
        "\\mathbf": TK_MATHBF,
        "\\abs": TK_ABS
      };
      var identifiers = keys(env);
      function isAlphaCharCode(c) {
        return c >= 65 && c <= 90 ||
          c >= 97 && c <= 122;
      }
      function isNumberCharCode(c) {
        return c >= 48 && c <= 57;
      }
      // Start scanning for one token.
      function start(options) {
        if (!options) {
          options = {};
        }
        var c;
        lexeme = "";
        while (curIndex < src.length) {
          switch ((c = src.charCodeAt(curIndex++))) {
          case 32:  // space
          case 9:   // tab
          case 10:  // new line
          case 13:  // carriage return
            continue;
          case 38:  // ampersand (new column or entity)
            if (indexOf(src.substring(curIndex), "nbsp;") === 0) {
              // Skip &nbsp;
              curIndex += 5;
              continue;
            }
            return TK_NEWCOL;
          case 92:  // backslash
            lexeme += String.fromCharCode(c);
            switch (src.charCodeAt(curIndex)) {
            case 92:
              curIndex++;
              return TK_NEWROW;   // double backslash = new row
            case 123: // left brace
            case 124: // vertical bar
            case 125: // right brace
              // Erase backslash.
              return src.charCodeAt(curIndex++);
            }
            var tk = latex();
            if (tk !== null) {
              return tk;
            }
            lexeme = "";
            continue;  // whitespace
          case 45:  // dash
            if (src.charCodeAt(curIndex) === 62) {
              curIndex++;
              return TK_RIGHTARROW;
            }
          case 33:  // bang, exclamation point
            if (src.charCodeAt(curIndex) === 61) { // equals
              curIndex++;
              return TK_NE;
            }
            return c; // char code is the token id
          case 37:  // percent
          case 40:  // left paren
          case 41:  // right paren
          case 42:  // asterisk
          case 43:  // plus
          case 44:  // comma
          case 47:  // slash
          case 58:  // colon
          case 61:  // equal
          case 91:  // left bracket
          case 93:  // right bracket
          case 94:  // caret
          case 95:  // underscore
          case 123: // left brace
          case 124: // vertical bar
          case 125: // right brace
            lexeme += String.fromCharCode(c);
            return c; // char code is the token id
          case 36:  // dollar
            lexeme += String.fromCharCode(c);
            return TK_VAR;
          case 60:  // left angle
            if (src.charCodeAt(curIndex) === 61) { // equals
              curIndex++;
              return TK_LE;
            }
            return TK_LT;
          case 62:  // right angle
            if (src.charCodeAt(curIndex) === 61) { // equals
              curIndex++;
              return TK_GE;
            }
            return TK_GT;
          default:
            if (isAlphaCharCode(c) ||
                c === "'".charCodeAt(0)) {
              return variable(c);
            } else if (String.fromCharCode(c) === getDecimalSeparator() ||
                       isNumberCharCode(c)) {
              if (options.oneCharToken) {
                lexeme += String.fromCharCode(c);
                return TK_NUM;
              }
              return number(c);
            }
            else {
              assert(false, message(1004, [String.fromCharCode(c), c]));
              return 0;
            }
          }
        }
        return 0;
      }
      // Recognize 1, 1.2, 0.3, .3
      var lastSeparator;
      function number(c) {
        while (isNumberCharCode(c) ||
               getDecimalSeparator() === String.fromCharCode(c) ||
               (lastSeparator = matchThousandsSeparator(String.fromCharCode(c), lastSeparator)) &&
               isNumberCharCode(src.charCodeAt(curIndex+1))) {  // Make sure the next char is a num.
          lexeme += String.fromCharCode(c);
          c = src.charCodeAt(curIndex++);
          if (c === 92 && src.charCodeAt(curIndex) === 32) {
            // Convert '\ ' to ' '.
            c = 32;
            curIndex++;
          }
        }
        if (lexeme === "." && indexOf(src.substring(curIndex), "overline") === 0) {
          // .\overline --> 0.\overline
          lexeme = "0.";
        }
        curIndex--;
        return TK_NUM;
      }
      // Recognize x, cm, kg.
      function variable(c) {
        // Normal variables are a single character, but we treat units as
        // variables too so we need to scan the whole unit string as a variable
        // name.
        var ch = String.fromCharCode(c);
        lexeme += ch;
        // All single character names are valid variable lexemes. Now we check
        // for longer matches against unit names. The longest one wins.
        while (isAlphaCharCode(c) ||
               c === "'".charCodeAt(0)) {
          c = src.charCodeAt(curIndex++);
          var ch = String.fromCharCode(c);
          var prefix = lexeme + ch;
          var match = some(identifiers, function (u) {
            return indexOf(u, prefix) === 0;
          });
          if (!match) {
            break;
          }
          lexeme += ch;
        }
        // Scan trailing primes ('). This handles single character identifier
        // with trailing primes.
        while (c === "'".charCodeAt(0)) {
          c = src.charCodeAt(curIndex++);
          var ch = String.fromCharCode(c);
          lexeme += ch;
        }
        curIndex--;
        return TK_VAR;
      }
      // Recognize \frac, \sqrt.
      function latex() {
        var c = src.charCodeAt(curIndex++);
        if (c === '$'.charCodeAt(0)) {
          // don't include \
          lexeme = String.fromCharCode(c);
        } else if (c === '%'.charCodeAt(0)) {
          lexeme += String.fromCharCode(c);
        } else if (indexOf([' '.charCodeAt(0),
                    ':'.charCodeAt(0),
                    ';'.charCodeAt(0),
                    ','.charCodeAt(0),
                    '!'.charCodeAt(0)], c) >= 0) {
          lexeme = "\\ ";
        } else {
          while (isAlphaCharCode(c)) {
            lexeme += String.fromCharCode(c);
            c = src.charCodeAt(curIndex++);
          }
          curIndex--;
        }
        var tk = lexemeToToken[lexeme];
        if (tk === void 0) {
          tk = TK_VAR;   // e.g. \\theta
        } else if (tk === TK_TEXT) {
          var c = src.charCodeAt(curIndex++);
          // Skip whitespace before '{'
          while (c && c !== "{".charCodeAt(0)) {
            c = src.charCodeAt(curIndex++);
          }
          lexeme = "";
          var c = src.charCodeAt(curIndex++);
          while (c && c !== "}".charCodeAt(0)) {
            var ch = String.fromCharCode(c);
            if (ch === "&" && indexOf(src.substring(curIndex), "nbsp;") === 0) {
              // Skip &nbsp;
              curIndex += 5;
            } else if (ch === " " || ch === "\t") {
              // Skip space and tab
            } else {
              lexeme += ch;
            }
            c = src.charCodeAt(curIndex++);
          }
          assert(lexeme !== "", message(1009, ["\\text"]));
          if (Model.option("ignoreText")) {
            tk = null;   // treat as whitespace
          } else {
            tk = TK_VAR; // treat as variable
          }
        }
        return tk;
      }
      // Return a scanner object.
      return {
        start : start ,
        lexeme : function () { return lexeme } ,
        pos: function() { return curIndex; }
      }
    }
  }
  return Model;
})();
