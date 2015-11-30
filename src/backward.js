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
if (!window.JSON) {
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





