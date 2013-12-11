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
  if (Array.prototype.indexOf) {
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
    function (val, str) {
      if ( str === void 0 ) {
        str = "failed!";
      }
      if ( !val ) {
        
        var err = new Error(str);
        err.location = Assert.location;
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

// Namespace functions for safe keeping.
var Assert = {
  assert: assert,
  message: message,
  messages: {},
  reserveCodeRange: reserveCodeRange,
  reservedCodes: [],
  setLocation: setLocation,
  clearLocation: clearLocation,
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
  Ast.prototype.args = function args(args) {
    if (!isNode(this)) {
      throw "Malformed node";
    }
    if (args === undefined) {
      return this.args;
    }
    this.args = args;
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
    // Intern primitive values and construct nodes for them.
    if (typeof node === "number") {
      node = {op: "num", args: [node.toString()]};
    } else if (typeof node === "string") {
      node = {op: "str", args: [node]};
    }
    assert(typeof node === "object", "node not an object");
    var op = node.op;
    var count = node.args.length;
    var args = "";
    var args_nids = [ ];
    for (var i=0; i < count; i++) {
      if (node.op === "str") {
        args += args_nids[i] = node.args[i];
      } else if (node.op === "num") {
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
  Ast.prototype.node = function node(nid) {
    var n = JSON.parse(JSON.stringify(nodePool[nid]));
    var node = create(n);
    // if literal, then unwrap.
    switch (n.op) {
    case "num":
    case "str":
      n = n;
      break;
    default:
      for (var i=0; i < n.args.length; i++) {
        n.args[i] = this.node(n.args[i]);
      }
      break;
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

var Model = (function () {
  function error(str) {
    trace("error: " + str);
  }

  function Model() {
  }

  Model.fn = {};

  var Mp = Model.prototype = new Ast();

  // Add messages here
  Assert.reserveCodeRange(1000, 1999, "model");
  Assert.messages[1001] = "Invalid syntax. '%1' expected, '%2' found.";
  Assert.messages[1002] = "Square brackets can only be used to denote intervals.";
  Assert.messages[1003] = "Extra characters in input at position: %1, lexeme: %2.";
  Assert.messages[1004] = "Invalid character '%1' (%2) in input.";
  var message = Assert.message;

  // Create a model from a node object or expression string
  Model.create = Mp.create = function create(node, location) {
    assert(node, "Model.create() called with invalid argument " + node);
    // If we already have a model, then just return it.
    if (node instanceof Model) {
      if (location) {
        node.location = location;
      }
      return node;
    }
    if (!(this instanceof Model)) {
      return new Model().create(node, location);
    }
    // Create a node that inherits from Ast
    var model = create(this);
    model.location = location;
    if (typeof node === "string") {
      // Got a string, so parse it into a node
      node = parse(node).expr();
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
    PM: "pm",
    SIN: "sin",
    COS: "cos",
    TAN: "tan",
    SEC: "sec",
    COT: "cot",
    CSC: "csc",
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
    INTERVAL: "interval",
    EXISTS: "exists",
    IN: "in",
    FORALL: "forall",
    LIM: "lim",
    EXP: "exp",
    TO: "to",
    SUM: "sum",
    INT: "int",
    PROD: "prod",
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
  OpToLaTeX[OpStr.SEC] = "\\sec";
  OpToLaTeX[OpStr.COT] = "\\cot";
  OpToLaTeX[OpStr.CSC] = "\\csc";
  OpToLaTeX[OpStr.LN] = "\\ln";
  OpToLaTeX[OpStr.COMMA] = ",";

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
      case OpStr.SEC:
      case OpStr.COT:
      case OpStr.CSC:
      case OpStr.LN:
        text = "{"+ OpToLaTeX[n.op] + "{" + args[0] + "}}";
        break;
      case OpStr.FRAC:
        text = "\\dfrac{" + args[0] + "}{" + args[1] + "}";
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

  var parse = function parse(src) {

    // Define lexical tokens
    var TK_NONE = 0;
    var TK_ADD = '+'.charCodeAt(0);
    var TK_CARET = '^'.charCodeAt(0);
    var TK_UNDERSCORE = '_'.charCodeAt(0);
    var TK_COS = 0x105;
    var TK_COT = 0x108;
    var TK_CSC = 0x109;
    var TK_DIV = '/'.charCodeAt(0);
    var TK_EQL = '='.charCodeAt(0);
    var TK_FRAC = 0x100;
    var TK_LN = 0x107;
    var TK_LEFTBRACE = '{'.charCodeAt(0);
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

    // Define operator strings
    var OpStr = {
      ADD: "+",
      SUB: "-",
      MUL: "times",
      DIV: "div",
      FRAC: "frac",
      EQL: "=",
      ATAN2: "atan2",
      SQRT: "sqrt",
      PM: "pm",
      SIN: "sin",
      COS: "cos",
      TAN: "tan",
      SEC: "sec",
      COT: "cot",
      CSC: "csc",
      LN: "ln",
      LG: "lg",
      LOG: "log",
      VAR: "var",
      CST: "cst",
      COMMA: ",",
      POW: "^",
      SUBSCRIPT: "_",
      ABS: "abs",
      PAREN: "()",
      HIGHLIGHT: "hi",
      TEXT: "text",
      LT: "lt",
      LE: "le",
      GT: "gt",
      GE: "ge",
      EXISTS: "exists",
      IN: "in",
      FORALL: "forall",
      LIM: "lim",
      EXP: "exp",
      TO: "to",
      SUM: "sum",
      INT: "int",
      PROD: "prod",
    };

    // Define mapping from token to operator
    var tokenToOperator = [];
    var T0 = TK_NONE, T1 = TK_NONE;
    tokenToOperator[TK_FRAC] = OpStr.FRAC;
    tokenToOperator[TK_SQRT] = OpStr.SQRT;
    tokenToOperator[TK_ADD] = OpStr.ADD;
    tokenToOperator[TK_SUB] = OpStr.SUB;
    tokenToOperator[TK_PM] = OpStr.PM;
    tokenToOperator[TK_CARET] = OpStr.POW;
    tokenToOperator[TK_MUL] = OpStr.MUL;
    tokenToOperator[TK_DIV] = OpStr.FRAC;
    tokenToOperator[TK_SIN] = OpStr.SIN;
    tokenToOperator[TK_COS] = OpStr.COS;
    tokenToOperator[TK_TAN] = OpStr.TAN;
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
    tokenToOperator[TK_EXISTS] = OpStr.EXISTS;
    tokenToOperator[TK_IN] = OpStr.IN;
    tokenToOperator[TK_FORALL] = OpStr.FORALL;
    tokenToOperator[TK_LIM] = OpStr.LIM;
    tokenToOperator[TK_EXP] = OpStr.EXP;
    tokenToOperator[TK_TO] = OpStr.TO;
    tokenToOperator[TK_SUM] = OpStr.SUM;
    tokenToOperator[TK_INT] = OpStr.INT;
    tokenToOperator[TK_PROD] = OpStr.PROD;

    var scan = scanner(src);

    function start() {
      T0 = scan.start();
    }

    function hd () {
      //assert(T0!==0, "hd() T0===0");
      return T0;
    }

    function lexeme () {
      return scan.lexeme();
    }

    function matchToken (t) {
      if (T0 == t) {
        next();
        return true;
      }
      return false;
    }

    function next () {
      T0 = T1;
      T1 = TK_NONE;
      if (T0 === TK_NONE) {
        T0 = scan.start();
      }
    }
    
    function replace (t) {
      T0 = t;
    }

    function eat (tc) {
      var tk = hd();
      if (tk !== tc) {
        var expected = String.fromCharCode(tc);
        var found = tk ? String.fromCharCode(tk) : "EOS";
        assert(false, message(1001, [expected, found]));
      }
      next();
    }
    
    function match (tc) {
      var tk = hd();
      if (tk !== tc)
        return false;
      next();
      return true;
    }

    function primaryExpr () {
      var e;
      var tk;
      var op;
      switch ((tk=hd())) {
      case 'A'.charCodeAt(0):
      case TK_VAR:
        e = {op: "var", args: [lexeme()]};
        next();
        break;
      case 'a'.charCodeAt(0):
        e = {op: "var", args: [lexeme()]};
        next();
        break;
      case TK_NUM:
        e = {op: "num", args: [lexeme()]};
        next();
        break;
      case TK_LEFTPAREN:
      case TK_LEFTBRACKET:
        e = parenExpr(tk);
        break;
      case TK_LEFTBRACE:
        e = braceExpr();
        break;
      case TK_FRAC:
        next();
        var expr1 = braceExpr();
        var expr2 = braceExpr();
        e = {
          op: Model.MUL,
          args: [expr1, {
            op: Model.POW,
            args: [
              expr2, {
                op: Model.NUM,
                args: ["-1"]
              }
            ]
          }]
        };
        break;
      case TK_SQRT:
        next();
        switch(hd()) {
        case TK_LEFTBRACKET:
          var root = bracketExpr();
          var base = braceExpr();
          e = {
            op: Model.POW,
            args: [
              base,
              root,
              {op: Model.NUM, args: ["-1"]}
            ]};
          break;
        case TK_LEFTBRACE:
          var base = braceExpr();
          if (base.op === Model.POW) {
            // Merge exponents
            // \sqrt{x^2} -> x^(2*2^-1)
            e = {
              op: Model.POW,
              args: [
                base.args[0], {
                  op: Model.MUL,
                  args: [
                    base.args[1], {
                      op: Model.POW,
                      args: [
                        {op: Model.NUM, args: ["2"]},
                        {op: Model.NUM, args: ["-1"]}
                      ]
                    }
                  ]
                }
              ]};
          } else {
            e = {
              op: Model.POW,
              args: [
                base,
                {op: Model.NUM, args: ["2"]},
                {op: Model.NUM, args: ["-1"]}
              ]};
          }
          break;
        default:
          assert(false, message(1001, ["{ or (", String.fromCharCode(hd())]));
          break;
        }
        break;
      case TK_SIN:
      case TK_COS:
      case TK_TAN:
      case TK_SEC:
      case TK_COT:
      case TK_CSC:
        next();
        var t, args = [];
        // Collect exponents if there are any
        while ((t=hd())===TK_CARET) {
          next();
          args.push(unaryExpr());
        }
        // Finish the trig function
        args.unshift({
          op: tokenToOperator[tk],
          args: [primaryExpr()]
        });
        if (args.length > 1) {
          return {
            op: Model.POW,
            args: args
          };
        } else {
          return args[0];
        }
        break;
      case TK_LN:
        next();
        return {
          op: Model.LOG,
          args: [{
            op: Model.VAR,
            args: ["e"]
          }, primaryExpr()]
        };
      case TK_LG:
        next();
        return {
          op: Model.LOG,
          args: [{
            op: Model.NUM,
            args: ["10"]
          }, primaryExpr()]
        };
      case TK_LOG:
        next();
        var t, args = [];
        // Collect the subscript if there is one
        if ((t=hd())===TK_UNDERSCORE) {
          next();
          args.push(primaryExpr());
        } else {
          args.push({
            op: Model.VAR,
            args: ["e"]    // default to natural log
          });
        }
        args.push(primaryExpr());
        // Finish the log function
        return {
          op: Model.LOG,
          args: args
        };
        break;
      case TK_LIM:
        next();
        var t, args = [];
        // Collect the subscript and expression
        eat(TK_UNDERSCORE);
        args.push(primaryExpr());
        args.push(primaryExpr());
        // Finish the log function
        return {
          op: tokenToOperator[tk],
          args: args
        };
        break;
      case TK_SUM:
      case TK_INT:
      case TK_PROD:
        next();
        var t, args = [];
        // Collect the subscript and expression
        if (hd() === TK_UNDERSCORE) {
          next();
          args.push(primaryExpr());
          eat(TK_CARET);              // If we have a subscript, then we expect a superscript
          args.push(primaryExpr());
        }
        args.push(commaExpr());
        // Finish the log function
        return {
          op: tokenToOperator[tk],
          args: args
        };
        break;
      case TK_EXISTS:
        next();
        return {
          op: Model.EXISTS,
          args: [equalExpr()]
        };
      case TK_FORALL:
        next();
        return {
          op: Model.FORALL,
          args: [commaExpr()]
        };
      case TK_EXP:
        next();
        return {
          op: Model.EXP,
          args: [additiveExpr()]
        };
      default:
        assert(false, "Model.primaryExpr() unexpected expression kind " + lexeme());
        e = void 0;
        break;
      }
      return e;
    }

    function braceExpr() {
      eat(TK_LEFTBRACE);
      var e = commaExpr();
      eat(TK_RIGHTBRACE);
      return e;
    }

    function bracketExpr() {
      eat(TK_LEFTBRACKET);
      var e = commaExpr();
      eat(TK_RIGHTBRACKET);
      return e;
    }

    function parenExpr(tk) {
      eat(tk);
      var e = commaExpr();
      eat(tk2 = hd() === TK_RIGHTPAREN ? TK_RIGHTPAREN : TK_RIGHTBRACKET);
      if (e.args.length !== 2 &&
          (tk === TK_LEFTBRACKET || tk2 === TK_RIGHTBRACKET)) {
        assert(false, message(1002));
      }
      // Save the brackets as attributes on the node for later use.
      e.lbrk = tk;
      e.rbrk = tk2;
      return e;
    }

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
        expr = unaryExpr();
        expr = {op: Model.SUB, args: [expr]};
        break;
      default:
        expr = primaryExpr();
        break;
      }
      return expr;
    }

    function subscriptExpr() {
      var t, args = [unaryExpr()];
      while ((t=hd())===TK_UNDERSCORE) {
        next();
        args.push(unaryExpr());
      }
      if (args.length > 1) {
        return {
          op: Model.SUBSCRIPT,
          args: args
        };
      } else {
        return args[0];
      }
    }

    function exponentialExpr() {
      var t, args = [subscriptExpr()];
      while ((t=hd())===TK_CARET) {
        next();
        args.push(subscriptExpr());
      }
      if (args.length > 1) {
        return {
          op: Model.POW,
          args: args
        };
      } else {
        return args[0];
      }
    }

    function multiplicativeExpr() {
      var t, expr;
      var args = [exponentialExpr()];
      // While lookahead is not a lower precedent operator
      while((t = hd()) && !isAdditive(t) && !isRelational(t) &&
            t !== TK_COMMA && t !== TK_EQL && t !== TK_RIGHTBRACE &&
            t !== TK_RIGHTPAREN && t !== TK_RIGHTBRACKET) {
        if (isMultiplicative(t)) {
          next();
        }
        expr = exponentialExpr();
        if (t === TK_DIV) {
          expr = {
            op: Model.POW,
            args: [
              expr, {
                op: Model.NUM,
                args: ["-1"]
              }
            ]
          };
        }
        args.push(expr);
      }
      if (args.length > 1) {
        return {
          op: Model.MUL,
          args: args
        };
      } else {
        return args[0];
      }

      function isMultiplicative(t) {
        return t === TK_MUL || t === TK_DIV;
      }
    }

    function isNeg(n) {
      if (typeof n === "number") {
        return n < 0;
      } else if (n.args.length===1) {
        return n.op===OpStr.SUB && n.args[0] > 0;  // is unary minus
      } else if (n.args.length===2) {
        return n.op===OpStr.MUL && isNeg(n.args[0]);  // leading term is neg
      }
    }

    function negate(n) {
      if (typeof n === "number") {
        return -n;
      } else if (n.args.length === 1) {
        if (n.op === Model.SUB) {
          return n.args[0];  // strip the unary minus
        } else if (n.op === Model.ADD) {
          n.args[0] = negate(n.args[0]);
          return n;
        } else {
          return {
            op: Model.MUL,
            args: [{
              op: Model.NUM, args: ["-1"]
            }, n]
          };
        }
      } else if (n.args.length === 2) {
        return {
          op: Model.SUB,
          args: [n]
        };
      }
      assert(false, "Unhandled case in negate() op=" + n.op + " n.args.length=" + n.args.length);
      return {
        op: Model.SUB,
        args: [n]
      };
    }

    function isAdditive(t) {
      return t === TK_ADD || t === TK_SUB || t === TK_PM;
    }

    function additiveExpr() {
      var expr = multiplicativeExpr();
      var t;
      while (isAdditive(t = hd())) {
        next();
        var expr2 = multiplicativeExpr();
        switch(t) {
        case TK_PM:
          expr = {op: Model.PM, args: [expr, expr2]};
          break;
        case TK_SUB:
          expr2 = negate(expr2);
          // fall through
        default:
          expr = {op: Model.ADD, args: [expr, expr2]};
          break;
        }
      }
      return expr;
    }

    function isRelational(t) {
      return t === TK_LT || t === TK_LE || t === TK_GT || t === TK_GE ||
             t === TK_IN || t === TK_TO;
    }

    function relationalExpr() {
      var expr = additiveExpr();
      var t;
      while (isRelational(t = hd())) {
        next();
        var expr2 = additiveExpr();
        switch(t) {
        default:
          expr = {op: tokenToOperator[t], args: [expr, expr2]};
          break;
        }
      }
      return expr;
    }

    function equalExpr() {
      var expr = relationalExpr();
      var t;
      while ((t = hd())===TK_EQL) {
        next();
        var expr2 = relationalExpr();
        expr = {op: tokenToOperator[t], args: [expr, expr2]};
      }
      return expr;
    }

    function commaExpr( ) {
      var expr = equalExpr();
      var args = [expr];
      var t;
      while ((t = hd())===TK_COMMA) {
        next();
        args.push(equalExpr());
      }
      if (args.length > 1) {
        return {op: tokenToOperator[TK_COMMA], args: args};
      } else {
        return expr;
      }
    }

    function expr() {
      start();
      var n = commaExpr();
      assert(!hd(), message(1003, [scan.pos(), scan.lexeme()]));
      return n;
    }

    function scanner(src) {

      var curIndex = 0;
      var lexeme = "";

      var lexemeToToken = [ ];

      lexemeToToken["\\times"] = TK_MUL;
      lexemeToToken["\\div"]   = TK_DIV;
      lexemeToToken["\\dfrac"] = TK_FRAC;
      lexemeToToken["\\frac"]  = TK_FRAC;
      lexemeToToken["\\sqrt"]  = TK_SQRT;
      lexemeToToken["\\pm"]    = TK_PM;
      lexemeToToken["\\sin"]   = TK_SIN;
      lexemeToToken["\\cos"]   = TK_COS;
      lexemeToToken["\\tan"]   = TK_TAN;
      lexemeToToken["\\sec"]   = TK_SEC;
      lexemeToToken["\\cot"]   = TK_COT;
      lexemeToToken["\\csc"]   = TK_CSC;
      lexemeToToken["\\ln"]    = TK_LN;
      lexemeToToken["\\lg"]    = TK_LG;
      lexemeToToken["\\log"]   = TK_LOG;
      lexemeToToken["\\left"]  = null;  // whitespace
      lexemeToToken["\\right"] = null;
      lexemeToToken["\\big"]   = null;
      lexemeToToken["\\Big"]   = null;
      lexemeToToken["\\bigg"]  = null;
      lexemeToToken["\\Bigg"]  = null;
      lexemeToToken["\\text"]  = TK_TEXT;
      lexemeToToken["\\textrm"]  = TK_TEXT;
      lexemeToToken["\\textit"]  = TK_TEXT;
      lexemeToToken["\\textbf"]  = TK_TEXT;
      lexemeToToken["\\lt"]  = TK_LT;
      lexemeToToken["\\le"]  = TK_LE;
      lexemeToToken["\\gt"]  = TK_GT;
      lexemeToToken["\\ge"]  = TK_GE;
      lexemeToToken["\\exists"]  = TK_EXISTS;
      lexemeToToken["\\in"]  = TK_IN;
      lexemeToToken["\\forall"]  = TK_FORALL;
      lexemeToToken["\\lim"]  = TK_LIM;
      lexemeToToken["\\exp"]  = TK_EXP;
      lexemeToToken["\\to"]  = TK_TO;
      lexemeToToken["\\sum"]  = TK_SUM;
      lexemeToToken["\\int"]  = TK_INT;
      lexemeToToken["\\prod"]  = TK_PROD;
      
      var units = [
        "g",
        "cg",
        "kg",
        "mg",
        "ng",
        "m",
        "cm",
        "km",
        "mm",
        "nm",
        "L",
        "mL",
        "s",
        "cs",
        "ks",
        "ms",
        "ns",
        "in",
        "ft",
        "mi",
        "fl",
        "cup",
        "pt",
        "qt",
        "gal",
        "oz",
        "lb",
      ];

      return {
        start : start ,
        lexeme : function () { return lexeme } ,
        pos: function() { return curIndex; },
      }

      function start () {
        var c;
        lexeme = "";
        while (curIndex < src.length) {
          switch ((c = src.charCodeAt(curIndex++))) {
          case 32:  // space
          case 9:   // tab
          case 10:  // new line
          case 13:  // carriage return
            continue;
          case 92:  // backslash
            lexeme += String.fromCharCode(c);
            var tk = latex();
            if (tk) {
              return tk;
            }
            lexeme = "";
            continue;  // whitespace
          case 40:  // left paren
          case 41:  // right paren
          case 42:  // asterisk
          case 43:  // plus
          case 44:  // comma
          case 45:  // dash
          case 47:  // slash
          case 61:  // equal
          case 91:  // left bracket
          case 93:  // right bracket
          case 94:  // caret
          case 95:  // underscore
          case 123: // left brace
          case 125: // right brace
            lexeme += String.fromCharCode(c);
            return c; // char code is the token id
          default:
            if (c >= 'A'.charCodeAt(0) && c <= 'Z'.charCodeAt(0)) {
              lexeme += String.fromCharCode(c);
              return TK_VAR;
            }
            else if (c >= 'a'.charCodeAt(0) && c <= 'z'.charCodeAt(0)) {
              return variable(c);
            }
            else if (c === '.'.charCodeAt(0) ||
                     c >= '0'.charCodeAt(0) && c <= '9'.charCodeAt(0)) {
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

      function number(c) {
        while (c >= '0'.charCodeAt(0) && c <= '9'.charCodeAt(0) ||
               c === '.'.charCodeAt(0)) {
          lexeme += String.fromCharCode(c);
          c = src.charCodeAt(curIndex++);
        }
        curIndex--;
        
        return TK_NUM;
      }

      function variable(c) {
        // Normal variables are a single character, but we treat units as
        // variables too so we need to scan the whole unit string as a variable
        // name.
        var ch = String.fromCharCode(c);
        lexeme += ch;

        // All single character names are valid variable lexemes. Now we check
        // for longer matches against unit names. The longest one wins.
        while (c >= 'a'.charCodeAt(0) && c <= 'z'.charCodeAt(0)) {
          c = src.charCodeAt(curIndex++);
          var ch = String.fromCharCode(c);
          var prefix = lexeme + ch;
          var match = some(units, function (u) {
            return u.indexOf(prefix) === 0;
          });
          if (!match) {
            break;
          }
          lexeme += ch;
        }
        curIndex--;
        return TK_VAR;
      }

      function latex() {
        var c = src.charCodeAt(curIndex++);
        while (c >= 'a'.charCodeAt(0) && c <= 'z'.charCodeAt(0) ||
               c >= 'A'.charCodeAt(0) && c <= 'Z'.charCodeAt(0)) {
          lexeme += String.fromCharCode(c);
          c = src.charCodeAt(curIndex++);
        }
        curIndex--;

        var tk = lexemeToToken[lexeme];
        if (tk === void 0) {
          tk = TK_VAR;   // e.g. \\theta
        } else if (tk === TK_TEXT) {
          var c = src.charCodeAt(curIndex++);
          while (c !== "{".charCodeAt(0)) {
            c = src.charCodeAt(curIndex++);
          }
          lexeme = "";
          var c = src.charCodeAt(curIndex++);
          while (c !== "}".charCodeAt(0)) {
            var ch = String.fromCharCode(c);
            lexeme += ch;
            c = src.charCodeAt(curIndex++);
          }
          tk = TK_VAR; // treat as a variable
        }
        return tk;
      }
    }

    return {
      expr : expr
    };
  }

  // Self tests

  function test() {
    trace("\nModel self testing");
    (function () {
      var node = Model.create("\\int y dx");
      trace("node=" + JSON.stringify(node, null, 2));
    })();
  }
  var RUN_SELF_TESTS = false;
  if (RUN_SELF_TESTS) {
    test();
  }
  return Model;
})();
