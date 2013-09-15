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

define(["lib/trace", "lib/assert", "src/ast"], function (trace, assert, Ast) {

  var TEST = false;

  function error(str) {
    trace("error: " + str);
  }

  function Model() {
  }

  Model.fn = {};

  var Mp = Model.prototype = new Ast();

  // Create a model from a node object or expression string
  Model.create = Mp.create = function create(node) {
    if (!(this instanceof Model)) {
      return new Model().create(node);
    }
    // Create a node that inherits from Ast
    var model = Object.create(this);
    if (typeof node === "string") {
      // Got a string, so parse it into a node
      node = parse(node).expr();
    } else {
      // Make a deep copy of the node
      node = JSON.parse(JSON.stringify(node));
    }
    // Add missing plugin functions to the Model prototype
    Object.keys(Model.fn).forEach(function (v, i) {
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
    Object.keys(node).forEach(function (v, i) {
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
    LN: "ln",
    VAR: "var",
    NUM: "num",
    CST: "cst",
    COMMA: ",",
    POW: "^",
    ABS: "abs",
    PAREN: "()",
    HIGHLIGHT: "hi",
  };

  Object.keys(OpStr).forEach(function (v, i) {
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
        n.args.forEach(function (term, index) {
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
        args.forEach(function (value, index) {
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

    // Define lexical tokans
    var TK_NONE = 0;
    var TK_ADD = '+'.charCodeAt(0);
    var TK_CARET = '^'.charCodeAt(0);
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
    var TK_COEFF = 'A'.charCodeAt(0);
    var TK_VAR = 'a'.charCodeAt(0);
    var TK_NEXT = 0x10A;

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
      VAR: "var",
      CST: "cst",
      COMMA: ",",
      POW: "^",
      ABS: "abs",
      PAREN: "()",
      HIGHLIGHT: "hi",
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
    tokenToOperator[TK_EQL] = OpStr.EQL;

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
        assert(false, "Expecting " + tc + " found " + tk);
        error("syntax error");
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
      var t;
      var op;
      switch ((t=hd())) {
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
        e = parenExpr();
        break;
      case TK_FRAC:
        next();
        e = {op: tokenToOperator[TK_FRAC], args: [braceExpr(), braceExpr()]};
        break;
      case TK_SQRT:
        next();
        switch(hd()) {
        case TK_LEFTBRACKET:
          e = {op: tokenToOperator[TK_SQRT], args: [bracketExpr(), braceExpr()]};
          break;
        case TK_LEFTBRACE:
          e = {op: tokenToOperator[TK_SQRT], args: [braceExpr()]};
          break;
        default:
          assert(false);
          break;
        }
        break;
      case TK_SIN:
      case TK_COS:
      case TK_TAN:
      case TK_SEC:
      case TK_COT:
      case TK_CSC:
      case TK_LN:
        next();
        e = {op: tokenToOperator[t], args: [braceExpr()]};
        break;
      default:
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

    function parenExpr() {
      eat(TK_LEFTPAREN);
      var e = commaExpr();
      eat(TK_RIGHTPAREN);
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

    function exponentialExpr() {
      var expr = unaryExpr();
      var t;
      while ((t=hd())===TK_CARET) {
        next();
        var expr2 = unaryExpr();
        if (expr2===1) {
          expr = expr;
        }
        else if (expr2===0) {
          expr = 1;
        }
        else {
          expr = {op: tokenToOperator[t], args: [expr, expr2]};
        }
      }

      return expr;
    }

    function multiplicativeExpr() {
      var expr = exponentialExpr();
      var t;

      while((t=hd())===TK_VAR || t===TK_LEFTPAREN) {
        var expr2 = exponentialExpr();
        if (expr2 === 1) {
          expr = expr;
        }
        else if (expr === 1) {
          expr = expr2;
        }
        else {
          expr = {op: OpStr.MUL, args: [expr, expr2]};
        }
      }

      while (isMultiplicative(t = hd())) {
        next();
        var expr2 = exponentialExpr();
        if (expr2===1) {
          expr = expr;
        }
        else if (t===TK_MUL && expr===1) {
          expr = expr2;
        }
        else {
          expr = {op: tokenToOperator[t], args: [expr, expr2]};
        }
      }
      return expr;

      function isMultiplicative(t) {
        return t===TK_MUL || t===TK_DIV;
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
          } else if (n.op === Model.NUM) {
            n.args[0] = "-" + n.args[0];
            return n;
          }
      } else if (n.args.length === 2 && n.op === OpStr.MUL && isNeg(n.args[0])) {
        return {op: n.op, args: [negate(n.args[0]), n.args[1]]};
      }
      assert(false);
      return n;
    }

    function additiveExpr() {
      var expr = multiplicativeExpr();
      var t;
      while (isAdditive(t = hd())) {
        next();
        var expr2 = multiplicativeExpr();
        expr = {op: tokenToOperator[t], args: [expr, expr2]};
      }
      return expr;

      function isAdditive(t) {
        return t === TK_ADD || t === TK_SUB || t === TK_PM;
      }
    }

    function equalExpr() {
      var expr = additiveExpr();
      var t;
      while ((t = hd())===TK_EQL) {
        next();
        var expr2 = additiveExpr();
        expr = {op: tokenToOperator[t], args: [expr, expr2]};
      }
      return expr;

    }

    function commaExpr( ) {
      var n = equalExpr();
      return n;
    }

    function expr ( ) {
      start();
      var n = commaExpr();
      return n;
    }

    function scanner(src) {

      var curIndex = 0;
      var lexeme = "";

      var lexemeToToken = [ ];

      lexemeToToken["\\times"] = TK_MUL;
      lexemeToToken["\\div"]   = TK_DIV;
      lexemeToToken["\\frac"]  = TK_FRAC;
      lexemeToToken["\\sqrt"]  = TK_SQRT;
      lexemeToToken["\\pm"]   = TK_PM;
      lexemeToToken["\\sin"]   = TK_SIN;
      lexemeToToken["\\cos"]   = TK_COS;
      lexemeToToken["\\tan"]   = TK_TAN;
      lexemeToToken["\\sec"]   = TK_SEC;
      lexemeToToken["\\cot"]   = TK_COT;
      lexemeToToken["\\csc"]   = TK_CSC;
      lexemeToToken["\\ln"]   = TK_LN;

      return {
        start : start ,
        lexeme : function () { return lexeme } ,
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
            return latex();
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
          case 123: // left brace
          case 125: // right brace
            lexeme += String.fromCharCode(c);
            return c; // char code is the token id
          default:
            if (c >= 'A'.charCodeAt(0) && c <= 'Z'.charCodeAt(0)) {
              lexeme += String.fromCharCode(c);
              return TK_COEFF;
            }
            else if (c >= 'a'.charCodeAt(0) && c <= 'z'.charCodeAt(0)) {
              lexeme += String.fromCharCode(c);
              return TK_VAR;
            }
            else if (c >= '0'.charCodeAt(0) && c <= '9'.charCodeAt(0)) {
              //lexeme += String.fromCharCode(c);
              //c = src.charCodeAt(curIndex++);
              //return TK_NUM;
              return number(c);
            }
            else {
              assert( false, "scan.start(): c="+c);
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

      function latex() {
        var c = src.charCodeAt(curIndex++);
        while (c >= 'a'.charCodeAt(0) && c <= 'z'.charCodeAt(0)) {
          lexeme += String.fromCharCode(c);
          c = src.charCodeAt(curIndex++);
        }
        curIndex--;

        var tk = lexemeToToken[lexeme];
        if (tk===void 0) {
          tk = TK_VAR;   // e.g. \\theta
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
      var model = new Model();

      var node = model.fromLaTex("10 + 20");
      node.intern();
      var str = model.toLaTex(node);
      var result = str === "10 + 20" ? "PASS" : "FAIL";
      trace(result + ": " + "fromLaTex, toLaTex: " + str);
      var nid1 = Model.create("10 + 20").intern();
      node.intern();
      var nid2 = Model.create({
        "op":"+",
        "args":[{
          "op": "num",
          "args": [10]
        }, {
          "op": "num",
          "args": [20]
        }]
      }).intern();
      var result = nid1 === nid2 ? "PASS" : "FAIL";
      trace(result + ": " + "Model.create() nid1=" + nid1 + " nid2=" + nid2);

      var node = Model.create("e^2");
      node.intern();
      var str = model.toLaTex(node);
      var result = str === "{e^{2}}" ? "PASS" : "FAIL";
      trace(result + ": " + "fromLaTex, toLaTex: " + str);

      var node = Model.create("(x+2)(x-3)");
      node.intern();
      var str = model.toLaTex(node);
      var result = str === "(x + 2)(x - 3)" ? "PASS" : "FAIL";
      trace(result + ": " + "fromLaTex, toLaTex: " + str);

      var node = Model.create("x^2+2x-1");
      node.intern();
      var str = model.toLaTex(node);
      var result = str === "{x^{2}} + 2x - 1" ? "PASS" : "FAIL";
      trace(result + ": " + "fromLaTex, toLaTex: " + str);

      var node = Model.create("e^(2pi)");
      node.intern();
      var str = model.toLaTex(node);
      var result = str === "{e^{2pi}}" ? "PASS" : "FAIL";
      trace(result + ": " + "fromLaTex, toLaTex: " + str);

      var node = Model.create("sin(2x)");
      node.intern();
      var str = model.toLaTex(node);
      var result = str === "{e^{2pi}}" ? "PASS" : "FAIL";
      trace(result + ": " + "fromLaTex, toLaTex: " + str);

      var node = Model.create("2sin(x)cos(x)");
      node.intern();
      var str = model.toLaTex(node);
      var result = str === "{e^{2pi}}" ? "PASS" : "FAIL";
      trace(result + ": " + "fromLaTex, toLaTex: " + str);

      var node = Model.create("(x+y)^2");
      node.intern();
      var str = model.toLaTex(node);
      var result = str === "{ (x + y) ^{2}}" ? "PASS" : "FAIL";
      trace(result + ": " + "fromLaTex, toLaTex: " + str);

      var node = Model.create("x^2+2xy+y^2");
      node.intern();
      var str = model.toLaTex(node);
      var result = str === "{x^{2}} + 2xy + {y^{2}}" ? "PASS" : "FAIL";
      trace(result + ": " + "fromLaTex, toLaTex: " + str);

      var node = Model.create("x=2(y+1)");
      node.intern();
      var str = model.toLaTex(node);
      var result = str === "x = 2(y + 1)" ? "PASS" : "FAIL";
      trace(result + ": " + "fromLaTex, toLaTex: " + str);

      var node = Model.create("x=2*y+2");
      node.intern();
      var str = model.toLaTex(node);
      var result = str === "x = 2y + 2" ? "PASS" : "FAIL";
      trace(result + ": " + "fromLaTex, toLaTex: " + str);

      var node = Model.create("x-2=2*y");
      node.intern();
      var str = model.toLaTex(node);
      var result = str === "x - 2 = 2y" ? "PASS" : "FAIL";
      trace(result + ": " + "fromLaTex, toLaTex: " + str);

      var node = Model.create("0.00012");
      var str = model.toLaTex(node);
      var result = str === "0.00012" ? "PASS" : "FAIL";
      trace(result + ": " + "fromLaTex, toLaTex: " + str);

      var node = Model.create("1.2e-4");
      var str = model.toLaTex(node);
      var result = str === "1.2e - 4" ? "PASS" : "FAIL";
      trace(result + ": " + "fromLaTex, toLaTex: " + str);

      var node = Model.create("3m2cm");
      node.intern();
      var str = model.toLaTex(node);
      var result = str === "" ? "PASS" : "FAIL";
      trace(result + ": " + "fromLaTex, toLaTex: " + str);

      var node = Model.create("302cm");
      node.intern();
      var str = model.toLaTex(node);
      var result = str === "302cm" ? "PASS" : "FAIL";
      trace(result + ": " + "fromLaTex, toLaTex: " + str);

      var node = Model.create("45N*m");
      var str = model.toLaTex(node);
      var result = str === "" ? "PASS" : "FAIL";
      trace(result + ": " + "fromLaTex, toLaTex: " + str + " expected: 45Nm");

      var node = Model.create("45J");
      var str = model.toLaTex(node);
      var result = str === "" ? "PASS" : "FAIL";
      trace(result + ": " + "fromLaTex, toLaTex: " + str + " expected: 45J");

//      var node = Model.create("[[2,0],[0,2]]*[1,1]");
//      var str = model.toLaTex(node);
//      var result = str === "" ? "PASS" : "FAIL";
//      trace(result + ": " + "fromLaTex, toLaTex: " + str);

//      var node = Model.create("{1,2,3}");
//      var str = model.toLaTex(node);
//      var result = str === "" ? "PASS" : "FAIL";
//      trace(result + ": " + "fromLaTex, toLaTex: " + str);

      var node = Model.create("((x)*(y))");
      node.intern();
      var str = model.toLaTex(node);
      var result = str === "xy" ? "PASS" : "FAIL";
      trace(result + ": " + "fromLaTex, toLaTex: " + str);

      var node = Model.create("1/2");
      node.intern();
      var str = model.toLaTex(node);
      var result = str === "\\dfrac{1}{2}" ? "PASS" : "FAIL";
      trace(result + ": " + "fromLaTex, toLaTex: " + str);

      var node = Model.create("a+b+c+d+e+f");
      node.intern();
      var str = model.toLaTex(node);
      var result = str === "a + b + c + d + e + f" ? "PASS" : "FAIL";
      trace(result + ": " + "fromLaTex, toLaTex: " + str);

      var node = Model.create("f(n+1)");
      node.intern();
      var str = model.toLaTex(node);
      var result = str === "f(n + 1)" ? "PASS" : "FAIL";
      trace(result + ": " + "fromLaTex, toLaTex: " + str);

//      var node = Model.create("1.35*10^(-4)");
//      node.intern();
//      var str = model.toLaTex(node);
//      var result = str === "\\dfrac{1}{2}" ? "PASS" : "FAIL";
//      trace(result + ": " + "fromLaTex, toLaTex: " + str);

//      trace(model.dumpAll());
    })();
  }

  if (TEST) {
    test();
  }

  return Model;
});
