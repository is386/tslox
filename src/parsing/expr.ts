import { Token } from '../scanning/token';

export class Expr {}

export class Binary extends Expr {
  static left: Expr;
  static operator: Token;
  static right: Expr;

  constructor(left: Expr, operator: Token, right: Expr) {
    super();
    Binary.left = left;
    Binary.operator = operator;
    Binary.right = right;
  }
}

export class Grouping extends Expr {
  static expression: Expr;

  constructor(expression: Expr) {
    super();
    Grouping.expression = expression;
  }
}

export class Literal extends Expr {
  static value: unknown;

  constructor(value: unknown) {
    super();
    Literal.value = value;
  }
}

export class Unary extends Expr {
  static operator: Token;
  static right: Expr;

  constructor(operator: Token, right: Expr) {
    super();
    Unary.operator = operator;
    Unary.right = right;
  }
}
