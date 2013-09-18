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

requirejs.config({
  baseUrl: "../src",
  paths: {
    src: "../src",
    lib: "../lib"
  }
});

requirejs(["trace", "ast", "model"], function (trace, Ast, Model) {

  // Example plugin function
  Model.fn.isEqual = function isEqual(n1, n2) {
    var nid1 = this.intern(n1);
    var nid2 = this.intern(n2);
    if (nid1 === nid2) {
      return true;
    }
    if (n1.op===n2.op && n1.args.length===n2.args.length) {
      if (n1.args.length===2) {
        var n1arg0 = this.intern(n1.args[0]);
        var n1arg1 = this.intern(n1.args[1]);
        var n2arg0 = this.intern(n2.args[0]);
        var n2arg1 = this.intern(n2.args[1]);
        if (n1arg0===n2arg1 && n1arg1===n2arg0) {
          return true;
        }
      }
    }
    return false;
  }

  function test() {
    trace("\nSimple math model self testing");
    (function () {
      var model = new Model();
      var node = model.fromLaTex("10 + 20");
      var result = model.isEqual(node, node) ? "PASS" : "FAIL";
      trace(result + ": " + "model.isEqual(node, node)");
      var result = node.isEqual(node) ? "PASS" : "FAIL";
      trace(result + ": " + "node.isEqual(node)");
      trace(model.dumpAll());
    })();
  }

  var TEST = true;
  if (TEST) {
    test();
  }
  
});
