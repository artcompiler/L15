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
      node = {op: "num", args: [node]};
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
        args += args_nids[i] = +node.args[i];
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
