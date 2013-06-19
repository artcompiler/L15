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
  This module defines an object model for academic exercises. The core data structure
  for a model is an abstract syntax tree. An AST is provided when constructing a
  model.

  The basic usage, assuming an "addition" plugin:

      var node = {op: "+", args: [1, 2]};
      var model = Model(node).makeDefaultContext();
	  var latex = model.math("parse", "1+2").math("format", {"color": "blue"});

  Model ASTs have the structure:

      { op: "+", 
        args: [1, 2], 
        style: {"num": blue},
        data: {"key1": "value1", "key2": "value2"},
      }
*/

(function (target) {

	jQuery.extend (target, {
		Model : Backbone.Model.extend({
			append: append,
			css: css,
			find: find,
			initialize: initialize,
		}),
	});

	function append(data) {
		var n = this.node;
		assert(jQuery.type(n) === "object", "invalid this to Model.append");
		if (jQuery.type(data)==="object" && data.node!==void 0) {
			switch (data.node.op) {
			case "list":
				n.args.concat(data.node.args);
				break;
			default:
				assert(false, "invalid input to Model.append");
				break;
			}
		}
		else {
			n.args.concat(data);
		}
	}

	function css(prop, val) {
		var n = this.node;
		if (!n.style) {
			n.style = {}
		}

		if (!val) {
			if (jQuery.type(prop) === "object") {
				jQuery.extend(n.style, prop);
				return this;
			}
			else {
				return n.style[prop];
			}
		}
		else {
			assert(typeof prop === "string", "Model.css: invalid argument");
			n.style[prop] = val;
			return this;
		}
	}

	function find(selector) {
		var n = this.node;
		var a = Model({op: "list", args: []});
		if (n===void 0) {
			return a;
		}
		if (select(selector, n)) {
			a.append(n);
		}
		jQuery.each(n.args, function (index, n) {
			if (select(selector, n)) {
				a.append(n);
			}
			a.append(find.call(n, selector));
		});
		return a;
	}

	function initialize() {
		var node = arguments[0];
		if (node===void 0) {
			node = {};
		}

		// initialize the state of 'this' object
		switch (jQuery.type(node)) {
		case "string":
			if (!Model.parse) {
				jQuery.error("Model.parse not implemented");
			}
			node = Model.parse(node);
			break;
		case "object":
			// node is already an AST
			break;
		}

		jQuery.extend( this, {
			node: node,
		});

	}

})(this);
