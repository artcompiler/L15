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

jQuery.extend ( this, {

  ASSERT: true,

  assert: function (val, str) {
    if ( !this.ASSERT ) {
      return;
    }
    if ( str === void 0 ) {
      str = "failed!";
    }
    if ( !val ) {
      alert("assert: " + str);
    }
  },

  ast: new function () {

    var nodePool = [ "unused" ];  // nodePool[0] is reserved

    // maps for fast lookup of nodes
    var numberMap = { };
    var stringMap = { };
    var nodeMap = { };

    jQuery.extend ( this, {
      fromLaTeX: fromLaTeX,
      toLaTeX: toLaTeX,
      eval: eval,
      intern: intern,
      node: node,
      dump: dump,
      dumpAll: dumpAll,
    } );

    return this;  // end control flow

    // private implementation

    function fromLaTeX(str, model) {
      if (model===void 0) {
        model = MathModel.init();   // default model
      }
      return model.parse(str);
    }

    function toLaTeX(n, model) {
      if (model===void 0) {
        model = MathModel.init();   // default model
      }
      return model.format(n, "large", BLUE);
    }

    function eval(n) {
      assert(false);
      return void 0;
    }

    function intern(n) {
      // nodify number and string literals
      if (jQuery.type(n) === "number") {
        var nid = numberMap[n];
        if (nid === void 0) {
          nodePool.push({op:"num", args: [n]});
          nid = nodePool.length - 1;
          numberMap[n] = nid;
        }
      }
      else if (jQuery.type(n) === "string") {
        var nid = stringMap[n];
        if (nid === void 0) {
          nodePool.push({op:"str", args: [n]});
          nid = nodePool.length - 1;
          stringMap[n] = nid;
        }
      }
      else {
        var op = n.op;
        var count = n.args.length;
        var args = "";
        var args_nids = [ ];
        for (var i=0; i < count; i++) {
          args += args_nids[i] = intern(n.args[i]);
        }
        var key = op+count+args;
        var nid = nodeMap[key];
        if (nid === void 0) {
          nodePool.push({
            op: op,
            args: args_nids,
          });
          nid = nodePool.length - 1 ;
          nodeMap[key] = nid;
        }
      }
      return nid;
    }

    function node(nid) {
      var n = jQuery.extend(true, {}, nodePool[nid]);
      // if literal, then unwrap.
      switch (n.op) {
      case "NUM":
      case "STR":
        n = n.args[0];
        break;
      default:
        for (var i=0; i < n.args.length; i++) {
          n.args[i] = node(n.args[i]);
        }
        break;
      }
      return n;
    }

    function dumpAll() {
      var s = "";
      for (var i=1; i < nodePool.length; i++) {
        var n = nodePool[i];
        s = s + "<p>" + i+": "+dump(n) + "</p>";
      }
      return s;
    }

    function dump(n) {

      if (jQuery.type(n) === "object") {
        switch (n.op) {
        case "num":
          var s = n.args[0];
          break;
        case "str":
          var s = "\""+n.args[0]+"\"";
          break;
        default:
          var s = "{ op: \"" + n.op + "\", args: [ ";
          for (var i=0; i < n.args.length; i++) {
            if (i > 0) {
              s += " , ";
            }
            s += dump(n.args[i]);
          }
          s += " ] }";
          break;
        }
      }
      else if (jQuery.type(n)==="string") {
        var s = "\""+n+"\"";
      }
      else {
        var s = n;
      }
      return s;
    }
  } (),
});
