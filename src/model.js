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
  This module defines an object model for academic exercises. A model operates
  on ASTs. Functions are provided for parsing and rendering to and from LaTex
  source.

    var model = new Model(mathPlugin);
    var actual = model.parse(response);
    var expected = model.parse(key);
    model.equivalentSymbolic(actual, expected);
    expected.equivalentSymbolic(actual);

    node.css("color", blue);
    node.css({color: "blue"});

    {op: "+", args: [1, 2], style: {color: "red", size: "14"}}

  Model methods

    parse()
    render()
    find()
    style()

    ast.create

*/

load("ast.js");

var Model = (function (target) {

  function Model() {
  }

  var Mp = Model.prototype;

  // Patch Model with plugin functions. If multiple plugins are registered
  // and a name collision occurs, the last one registered wins.
  Mp.registerPlugin = function registerPlugin(plugin) {
    plugin.keys().forEach(function (n) {
      Mp[n] = plugin[n];
    });
  }

  // Create a Model node from LaTex source.
  Mp.fromLaTex = function fromLaTex(src) {
    assert(typeof str === "string");
    // Create a node that inherits from Model.
    var node = Object.create(this);
    // Initialize the node from the src string.
    node.parse(str);
    return node;
  }

  // Render LaTex from the model node.
  Mp.toLaTex = function toLaTex() {
    var node = this;
    return node.format();
  }

  // Style an AST node.
  Mp.css = function css(prop, val) {
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

  // Select an AST node.
  Mp.find = function find(selector) {
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

  var isModel = Mp.isModel = function isModel(node) {
    return assert(false, "Not implemented");
  }
  
  var isEqual = Mp.isEqual = function isEqual(n1, n2) {
    var nid1 = ast.intern(n1);
    var nid2 = ast.intern(n2);
    if (nid1===nid2) {
      return true;
    }
    if (n1.op===n2.op && n1.args.length===n2.args.length) {
      if (n1.args.length===2) {
        var n1arg0 = ast.intern(n1.args[0]);
        var n1arg1 = ast.intern(n1.args[1]);
        var n2arg0 = ast.intern(n2.args[0]);
        var n2arg1 = ast.intern(n2.args[1]);
        if (n1arg0===n2arg1 && n1arg1===n2arg0) {
          return true;
        }
      }
    }
    return false;
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
    CST: "cst",
    COMMA: ",",
    POW: "^",
    ABS: "abs",
    PAREN: "()",
    HIGHLIGHT: "hi",
  };
    
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

  // format an AST
  var format = function format(n, color, textSize) {
    if (textSize===void 0) {
      textSize = "normalsize";
    }
    if (color===void 0) {
      color = "#000";  // black is the default
    }
    var text;
    if (jQuery.type(n)==="string") {
      n = parse(n);
    }
    if (jQuery.type(n)==="number") {
      text = "\\color{"+color+"}{"+n+"}";
    }
    else if (jQuery.type(n)==="object") {
      // format sub-expressions
      var args = [];
      for (var i = 0; i < n.args.length; i++) {
        args[i] = format(n.args[i], color, textSize);
      }
      // format operator
      switch (n.op) {
      case OpStr.VAR:
      case OpStr.CST:
        text = "\\color{"+color+"}{"+n.args[0]+"}";
        break;
      case OpStr.SUB:
        if (n.args.length===1) {
          text = "\\color{#000}{"+ OpToLaTeX[n.op] + "} " + args[0];
        }
        else {
          text = args[0] + " \\color{#000}{" + OpToLaTeX[n.op] + "} " + args[1];
        }
        break;
      case OpStr.DIV:
      case OpStr.PM:
      case OpStr.EQL:
        text = args[0] + " \\color{#000}{" + OpToLaTeX[n.op] + "} " + args[1];
        break;
      case OpStr.POW:
        // if subexpr is lower precedence, wrap in parens
        var lhs = n.args[0];
        var rhs = n.args[1];
        if ((lhs.args && lhs.args.length===2) || (rhs.args && rhs.args.length===2)) {
          if (lhs.op===OpStr.ADD || lhs.op===OpStr.SUB ||
            lhs.op===OpStr.MUL || lhs.op===OpStr.DIV ||
            lhs.op===OpStr.SQRT) {
            args[0] = "\\color{#000}{(} " + args[0] + "\\color{#000}{)} ";
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
        text = "\\color{"+"#000"+"}{"+ OpToLaTeX[n.op] + "{" + args[0] + "}}";
        break;
      case OpStr.FRAC:
        text = "\\color{#000}{\\dfrac{" + args[0] + "}{" + args[1] + "}}";
        break;
      case OpStr.SQRT:
        switch (args.length) {
        case 1:
          text = "\\color{" + "#000" + "}{\\sqrt{" + args[0] + "}}";
          break;
        case 2:
          text = "\\color{" + "#000" + "}{\\sqrt[" + args[0] + "]{" + args[1] + "}}";
          break;
        }
        break;
      case OpStr.MUL:
        // if subexpr is lower precedence, wrap in parens
        var prevTerm;
        text = "";
        jQuery.each(n.args, function (index, term) {
          if (term.args && (term.args.length >= 2)) {
            if (term.op===OpStr.ADD || term.op===OpStr.SUB) {
              args[index] = "\\color{#000}{(} " + args[index] + "\\color{#000}{)}";
            }
            if (index !== 0 && jQuery.type(term)==="number") {
              text += "\\color{#000}{" + OpToLaTeX[n.op] + "} ";
            }
            text += args[index];
          }
          // elide the times symbol if rhs is parenthesized or a var, or lhs is a number
          // and rhs is not a number
          else if (term.op===OpStr.PAREN ||
               term.op===OpStr.VAR ||
               term.op===OpStr.CST ||
               jQuery.type(prevTerm)==="number" && jQuery.type(term)!=="number") {
            text += args[index];
          }
          else {
            if (index !== 0) {
              text += " \\color{#000}{" + OpToLaTeX[n.op] + "} ";
            }
            text += args[index];
          }
          prevTerm = term;
        });
        break;
      case OpStr.ADD:
      case OpStr.COMMA:
        jQuery.each(args, function (index, value) {
          if (index===0) {
            text = value;
          }
          else {
            text = text + " \\color{#000}{"+ OpToLaTeX[n.op] + "} " + value;
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
      EQL: "=",
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
        jQuery.error("syntax error");
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
        e = {op: "var", args: [lexeme()]};
        next();
        break;
      case 'a'.charCodeAt(0):
        e = {op: "var", args: [lexeme()]};
        next();
        break;
      case TK_NUM:
        e = Number(lexeme());
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
        expr = negate(unaryExpr());
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
      }
      else if (n.args.length===1) {
        return n.op===OpStr.SUB && n.args[0] > 0;  // is unary minus
      }
      else if (n.args.length===2) {
        return n.op===OpStr.MUL && isNeg(n.args[0]);  // leading term is neg
      }
    }

    function negate(n) {
      if (typeof n === "number") {
        return -n;
      }
      else if (n.args.length === 1 && n.op === OpStr.SUB) {
        return n.args[0];  // strip the unary minus
      }
      else if (n.args.length === 2 && n.op === OpStr.MUL && isNeg(n.args[0])) {
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
        if (t === TK_ADD && isNeg(expr2)) {
          t = TK_SUB;
          expr2 = negate(expr2);
        }
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

    function commaExpr ( ) {
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
        while (c >= '0'.charCodeAt(0) && c <= '9'.charCodeAt(0)) {
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
  }
})();
