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
  Assert.messages[1002] = "Square brackets can only be used to denote intervals.";
  Assert.messages[1003] = "Extra characters in input at position: %1, lexeme: %2.";
  Assert.messages[1004] = "Invalid character '%1' (%2) in input.";
  Assert.messages[1005] = "Misplaced thousands separator.";
  Assert.messages[1006] = "Unexpected expression: %1";
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
    var TK_DIV = '/'.charCodeAt(0);
    var TK_EQL = '='.charCodeAt(0);
    var TK_FRAC = 0x100;
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
    var T0 = TK_NONE, T1 = TK_NONE;
    // Define mapping from token to operator
    var tokenToOperator = {};
    tokenToOperator[TK_FRAC] = OpStr.FRAC;
    tokenToOperator[TK_SQRT] = OpStr.SQRT;
    tokenToOperator[TK_VEC] = OpStr.VEC;
    tokenToOperator[TK_ADD] = OpStr.ADD;
    tokenToOperator[TK_SUB] = OpStr.SUB;
    tokenToOperator[TK_PM] = OpStr.PM;
    tokenToOperator[TK_CARET] = OpStr.POW;
    tokenToOperator[TK_MUL] = OpStr.MUL;
    tokenToOperator[TK_DIV] = OpStr.FRAC;
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

    function newNode(op, args) {
      return {
        op: op,
        args: args
      };
    }

    // Construct a number node.
    function numberNode(n0, doScale, roundOnly) {
      // doScale - scale n if true
      // roundOnly - only scale if rounding
      var n1 = n0.toString();
      var n2 = "";
      var i, ch;
      var lastSeparatorIndex;
      var hasSeparator = false;
      var numberFormat = "integer";
      for (i = 0; i < n1.length; i++) {
        if ((ch = n1.charAt(i)) === ",") {
          if (hasSeparator && lastSeparatorIndex !== i - 4) {
            assert(false, message(1005));
          }
          lastSeparatorIndex = i;
          hasSeparator = true;
        } else {
          if (ch === '.') {
            numberFormat = "decimal";
            if (hasSeparator && lastSeparatorIndex !== i - 4) {
              assert(false, message(1005));
            }
            hasSeparator = false;  // No longer need to worry about thousands separators.
          }
          n2 += ch;
        }
      }
      if (hasSeparator && lastSeparatorIndex !== i - 4) {
        assert(false, message(1005));
      }
      if (doScale) {
        n2 = new BigDecimal(n2);
        var scale = option("decimalPlaces")
        if (!roundOnly || n2.scale() > scale) {
          n2 = n2.setScale(scale, BigDecimal.ROUND_HALF_UP);
        }
      }
      return {
        op: Model.NUM,
        hasThousandsSeparator: hasSeparator,
        numberFormat: numberFormat,
        args: [n2]
      }
    }
    // Construct a multiply node.
    function multiplyNode(args, flatten) {
      return binaryNode(Model.MUL, args, flatten);
    }
    // Construct a unary node.
    function unaryNode(op, args) {
      assert(args.length === 1, "Wrong number of arguments for unary node");
      if (op === Model.ADD) {
        return args[0];
      } else {
        return newNode(op, args);
      }
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

    //
    // PARSER
    //
    // Manage the token stream.
    var scan = scanner(src);
    // Prime the token stream.
    function start() {
      T0 = scan.start();
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
    function next() {
      T0 = T1;
      T1 = TK_NONE;
      if (T0 === TK_NONE) {
        T0 = scan.start();
      }
    }
    // Consume the current token if it matches, otherwise throw.
    function eat(tc) {
      var tk = hd();
      if (tk !== tc) {
        var expected = String.fromCharCode(tc);
        var found = tk ? String.fromCharCode(tk) : "EOS";
        assert(false, message(1001, [expected, found]));
      }
      next();
    }
    // Begin parsing functions.
    function primaryExpr () {
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
          next();
          args.push(primaryExpr());   // {op:VAR, args:["Fe", "2"]}
        }
        e = newNode(Model.VAR, args);
        break;
      case TK_NUM:
        e = numberNode(lexeme());
        next();
        if (isChemCore() && ((t = hd()) === TK_ADD || t === TK_SUB)) {
          next();
          // 3+, ion
          e = unaryNode(t, [e]);
        }
        break;
      case TK_LEFTPAREN:
      case TK_LEFTBRACKET:
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
        if (figure.args[0].indexOf("matrix") >= 0) {
          e = newNode(Model.MATRIX, [tbl]);
        } else {
          assert(false, "Unrecognized LaTeX name");
        }
        break;
      case TK_VERTICALBAR:
        e = absExpr();
        break;
      case TK_FRAC:
        next();
        var expr1 = braceExpr();
        var expr2 = braceExpr();
        e = newNode(Model.MUL, [expr1, newNode(Model.POW, [expr2, nodeMinusOne])]);
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
          e = newNode(Model.POW, [base, root, nodeMinusOne]);
          break;
        case TK_LEFTBRACE:
          var base = braceExpr();
          e = newNode(Model.POW, [base, newNode(Model.NUM, ["2"]), nodeMinusOne]);
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
          next();
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
          next();
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
          next();
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
          next();
          args.push(primaryExpr());
          eat(TK_CARET);              // If we have a subscript, then we expect a superscript
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
      eat(TK_LEFTBRACE);
      var e = commaExpr();
      eat(TK_RIGHTBRACE);
      return e;
    }
    // Parse '[ expr ]'
    function bracketExpr() {
      eat(TK_LEFTBRACKET);
      var e = commaExpr();
      eat(TK_RIGHTBRACKET);
      return e;
    }
    // Parse '( expr )'
    function parenExpr(tk) {
      var tk2;
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
      // intervals: (1, 3), [1, 3], [1, 3), (1, 3]
      if (Model.option("allowInterval") && e.args.length === 2 &&
          (tk === TK_LEFTPAREN || tk === TK_LEFTBRACKET) &&
          (tk2 === TK_RIGHTPAREN || tk2 === TK_RIGHTBRACKET)) {
        e = unaryNode(Model.INTERVAL, [e]);
      } else if (e.op === Model.COMMA) {
        e = unaryNode(Model.LIST, [e]);
      }
      return e;
    }
    // Parse '10%', '4!'
    function postfixExpr() {
      var t;
      var expr = primaryExpr();
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
      case TK_CARET:
        next();
        expr = unaryExpr();
        expr = newNode(tokenToOperator[t], [expr]);
        break;
      default:
        expr = postfixExpr();
        break;
      }
      return expr;
    }
    // Parse 'x_2'
    function subscriptExpr() {
      var t, args = [unaryExpr()];
      while ((t=hd())===TK_UNDERSCORE) {
        next();
        args.push(unaryExpr());
      }
      if (args.length > 1) {
        return newNode(Model.SUBSCRIPT, args);
      } else {
        return args[0];
      }
    }
    // Parse 'x^2'
    function exponentialExpr() {
      var t, args = [subscriptExpr()];
      while ((t=hd())===TK_CARET) {
        next();
        var t;
        if ((isMathSymbol(args[0]) || isChemCore() && isChemSymbol(args[0])) &&
            ((t = hd()) === TK_ADD || t === TK_SUB)) {
          next();
          // Na^+
          args.push(unaryNode(t, [nodeOne]));
        } else {
          var n = unaryExpr();
          if (isChemCore() && ((t = hd()) === TK_ADD || t === TK_SUB)) {
            next();
            // Al^3+
            args.push(unaryNode(t, [n]));
          } else if (n.op === Model.VAR && n.args[0] === "\\circ") {
            // 90^{\circ} -> 90\degree
            args = [
              multiplyNode([args[0], newNode(Model.VAR, ["\\degree"])])
            ];
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
    //
    function isChemSymbol(n) {
      if (n.op !== Model.VAR) {
        return false;
      }
      var sym = Model.env[n.args[0]];
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
      var t, expr, explicitOperator = false, isFraction;
      var args = [exponentialExpr()];
      // While lookahead is not a lower precedent operator
      // FIXME need a better way to organize this condition
      while((t = hd()) && !isAdditive(t) && !isRelational(t) &&
            t !== TK_COMMA && t !== TK_EQL && t !== TK_RIGHTBRACE &&
            t !== TK_RIGHTPAREN && t !== TK_RIGHTBRACKET &&
            t !== TK_RIGHTARROW && t !== TK_LT && t !== TK_VERTICALBAR &&
            t !== TK_NEWROW && t !== TK_NEWCOL && t !== TK_END) {
        explicitOperator = false;
        if (isMultiplicative(t)) {
          next();
          explicitOperator = true;
        }
        expr = exponentialExpr();
        if (t === TK_DIV) {
          expr = newNode(Model.POW, [expr, nodeMinusOne]);
          isFraction = true;
        }
        if (isChemCore() && t === TK_LEFTPAREN && isVar(args[args.length-1], "M")) {
          // M(x) -> \M(x)
          args.pop();
          expr = unaryNode(Model.M, [expr]);
        } else if (!explicitOperator && isMixedFraction([args[args.length-1], expr])) {
          // 3 \frac{1}{2} -> 3 + \frac{1}{2}
          t = args.pop();
          if (isNeg(t)) {
            expr = binaryNode(Model.MUL, [nodeMinusOne, expr]);
          }
          expr = binaryNode(Model.ADD, [t, expr]);
          expr.isMixedFraction = true;
        }
        args.push(expr);
      }
      if (args.length > 1) {
        if (isChemCore() && isChemSymbol(args[1])) {
          // 2NaCl NaCl
          if (isNumber(args[0])) {
            // 2NaCl
            var coeff = args.shift();
            return multiplyNode([coeff, binaryNode(Model.ADD, args)]);
          } else {
            // NaCl
            return binaryNode(Model.ADD, args);
          }
        } else {
          expr = multiplyNode(args);
          expr.isFraction = isFraction;
          return expr;
        }
      } else {
        return args[0];
      }
      //
      function isMultiplicative(t) {
        return t === TK_MUL || t === TK_DIV;
      }
    }

    function isNumber(n) {
      return n.op === Model.NUM;
    }

    function isMixedFraction(args) {
      // 3 \frac{1}{2}
      if (args[1].op === Model.MUL &&
          args[1].args[0].op === Model.NUM &&
          args[1].args[1].op === Model.POW &&
          args[1].args[1].args[0].op === Model.NUM &&
          args[1].args[1].args[1].op === Model.NUM &&
          args[1].args[1].args[1].args[0] === "-1" &&
          (args[0].op === Model.NUM  ||
           isAdditive(args[0].op) &&              // unary + or -
           args[0].args.length === 1 &&
           args[0].args[0].op === Model.NUM ||
           args[0].op === Model.MUL &&            // -1*n (expansion)
           args[0].args.length === 2 &&
           args[0].args[0].op === Model.NUM &&
           args[0].args[0].args[0] === "-1")) {
        return true;
      }
      return false;
      function isAdditive(op) {
        return op === Model.ADD ||
          op === Model.SUB;
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
      } else if (n.args.length === 1) {
        if (n.op === Model.SUB) {
          return n.args[0];  // strip the unary minus
        } else if (n.op === Model.ADD) {
          n.args[0] = negate(n.args[0]);
          return n;
        } else if (n.op === Model.NUM) {
          return numberNode("-" + n.args[0]);
        } else {
          return multiplyNode([nodeMinusOne, n]);
        }
      } else if (n.op === Model.MUL) {
        n.args.unshift(nodeMinusOne);
        return n;
      }
      return multiplyNode([nodeMinusOne, n]);
    }
    //
    function isAdditive(t) {
      return t === TK_ADD || t === TK_SUB || t === TK_PM;
    }
    // Parse 'a + b'
    function additiveExpr() {
      var expr = multiplicativeExpr();
      var t;
      while (isAdditive(t = hd())) {
        next();
        var expr2 = multiplicativeExpr();
        switch(t) {
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
      while (isRelational(t = hd())) {
        next();
        if (hd() === 0) {
          // Leading '=' so synthesize a variable.
          var expr2 = newNode(Model.VAR, ["_"]);
        } else {
          var expr2 = additiveExpr();
        }
        switch(t) {
        default:
          expr = newNode(tokenToOperator[t], [expr, expr2]);
          break;
        }
      }
      return expr;
    }
    // Parse 'x = 10'
    function equalExpr() {
      if (hd() === TK_EQL) {
        // Leading '=' so synthesize a variable.
        var expr = newNode(Model.VAR, ["_"]);
      } else {
        var expr = relationalExpr();
      }
      var t;
      while ((t = hd()) === TK_EQL || t === TK_RIGHTARROW) {
        next();
        if (hd() === 0) {
          // Trailing '=' so synthesize a variable.
          var expr2 = newNode(Model.VAR, ["_"]);
        } else {
          var expr2 = relationalExpr();
        }
        expr = newNode(tokenToOperator[t], [expr, expr2]);
      }
      return expr;
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
        assert(!hd(), message(1003, [scan.pos(), scan.lexeme()]));
        return n;
      }
      // No meaningful input. Return a dummy node to avoid choking.
      return numberNode("dummy");
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
        "\\binom": TK_BINOM,
        "\\begin": TK_BEGIN,
        "\\end": TK_END,
        "\\colon": TK_COLON,
        "\\vert": TK_VERTICALBAR,
        "\\lvert": TK_VERTICALBAR,
        "\\rvert": TK_VERTICALBAR,
        "\\mid": TK_VERTICALBAR,
      };
      var identifiers = keys(env);
      // Return a scanner object.
      return {
        start : start ,
        lexeme : function () { return lexeme } ,
        pos: function() { return curIndex; },
      }
      // Start scanning for one token.
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
          case 38:  // ampersand (new column or entity)
            if (src.substring(curIndex).indexOf("nbsp;") === 0) {
              // Skip &nbsp;
              curIndex += 5;
              continue;
            }
            return TK_NEWCOL;
          case 92:  // backslash
            lexeme += String.fromCharCode(c);
            if (src.charCodeAt(curIndex) === 92) {
              curIndex++;
              return TK_NEWROW;   // double backslash = new row
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
            if (c >= 'A'.charCodeAt(0) && c <= 'Z'.charCodeAt(0) ||
                c >= 'a'.charCodeAt(0) && c <= 'z'.charCodeAt(0) ||
                c === "'".charCodeAt(0)) {
              return variable(c);
            } else if (c === '.'.charCodeAt(0) ||
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
      // Recognize 1, 1.2, 0.3, .3
      function number(c) {
        while (c >= '0'.charCodeAt(0) && c <= '9'.charCodeAt(0) ||
               c === '.'.charCodeAt(0) ||
               Model.option("allowThousandsSeparator") &&
               c === ','.charCodeAt(0)) {
          lexeme += String.fromCharCode(c);
          c = src.charCodeAt(curIndex++);
        }
        curIndex--;
        if (lexeme.indexOf(".") === 0) {
          // .12 -> 0.12
          lexeme = "0" + lexeme;
        }
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
        while (c >= 'a'.charCodeAt(0) && c <= 'z'.charCodeAt(0) ||
               c >= 'A'.charCodeAt(0) && c <= 'Z'.charCodeAt(0) ||
               c === "'".charCodeAt(0)) {
          c = src.charCodeAt(curIndex++);
          var ch = String.fromCharCode(c);
          var prefix = lexeme + ch;
          var match = some(identifiers, function (u) {
            return u.indexOf(prefix) === 0;
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
        } else if ([' '.charCodeAt(0),
                    ':'.charCodeAt(0),
                    ';'.charCodeAt(0),
                    ','.charCodeAt(0),
                    '!'.charCodeAt(0)].indexOf(c) >= 0) {
          lexeme = "\\ ";
        } else {
          while (c >= 'a'.charCodeAt(0) && c <= 'z'.charCodeAt(0) ||
                 c >= 'A'.charCodeAt(0) && c <= 'Z'.charCodeAt(0)) {
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
          while (c !== "{".charCodeAt(0)) {
            c = src.charCodeAt(curIndex++);
          }
          lexeme = "";
          var c = src.charCodeAt(curIndex++);
          while (c !== "}".charCodeAt(0)) {
            var ch = String.fromCharCode(c);
            if (ch === "&" && src.substring(curIndex).indexOf("nbsp;") === 0) {
              // Skip &nbsp;
              curIndex += 5;
            } else if (ch === " " || ch === "\t") {
              // Skip space and tab
            } else {
              lexeme += ch;
            }
            c = src.charCodeAt(curIndex++);
          }
          if (Model.option("ignoreText")) {
            tk = null;   // treat as whitespace
          } else {
            tk = TK_VAR; // treat as variable
          }
        }
        return tk;
      }
    }
  }
  return Model;
})();
