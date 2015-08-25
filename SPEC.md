## L15 Specification

The contents of this file specifies the syntax of L15.


### Commands

```
    \cdot
    \times
    \div
    \dfrac
    \frac
    \sqrt
    \vec
    \pm
    \sin
    \cos
    \tan
    \sec
    \cot
    \csc
    \arcsin
    \arccos
    \arctan
    \ln
    \lg
    \log
    \left
    \right
    \big
    \Big
    \bigg
    \Bigg
    \ [space]
    \quad
    \qquad
    \text
    \textrm
    \textit
    \textbf
    \lt
    \le
    \gt
    \ge
    \ne
    \approx
    \exists
    \in
    \forall
    \lim
    \exp
    \to
    \sum
    \int
    \prod
    \%
    \rightarrow
    \longrightarrow
    \binom
    \begin
    \end
    \colon
    \vert
    \lvert
    \rvert
    \mid
    \format
    \overline
    \overset
    \underset
    \backslash
    \mathbf
```

```
PrimaryExpr :=
    VARIABLE
    NUMBER
    ParenExpr
    BraceExpr
    BracketExpr
    Matrix
    AbsoluteValue
```
```
PrefixExpr :=
    FRAC BraceExpr BraceExpr
    LIMIT Subscript PrimaryExpr
    MATHBF BraceExpr
    OVERSET BraceExpr
    UNDERSET BraceExpr
    OVERLINE BraceExpr
    FORMAT FormatPattern
    M MultiplicativeExpr
    EXP AdditiveExpr
    FORALL CommaExpr
    EXISTS equalExpr    
    VEC BraceExpr
    Logarithm
    Summation
    Binomial
    SquareRoot
    TrigFunction
```
```
SquareRoot :=
    SQRT BracketExpr BraceExpr
    SQRT BraceExpr
```
```
Summation
    SUM Subscript SuperScript PrimaryExpr
    SUM CommaExpr
```
```
Logarithm :=
    LN PrimaryExpr
    LG PrimaryExpr
    LOG Subscript
    LOG Subscript PrimaryExpr
    LOG PrimaryExpr
```
```
Limit :=
    LG PrimaryExpr
    LOG Subscript
    LOG Subscript PrimaryExpr
    LOG PrimaryExpr
```
```
InfixExpr :=
    DIV
```

CommaExpr
    EqualExpr
    CommaExpr EqualExpr

EqualExpr
    **=**
    EqualExpr **=** AdditiveExpr


```
```

```
```

```
```