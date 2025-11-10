import {
  Binary,
  Expr,
  Grouping,
  Literal,
  Unary,
  Visitor,
} from '../parsing/expr';
import { TokenType } from '../scanning/token-type';

export class Interpreter implements Visitor<unknown> {
  visitBinaryExpr(expr: Binary): unknown {
    const left = this.evaluate(expr.left);
    const right = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case TokenType.MINUS:
        return (left as number) - (right as number);
      case TokenType.PLUS:
        if (left instanceof Number && right instanceof Number) {
          return (left as number) + (right as number);
        }
        if (left instanceof String && right instanceof String) {
          return (left as string) + (right as string);
        }
        break;
      case TokenType.SLASH:
        return (left as number) / (right as number);
      case TokenType.STAR:
        return (left as number) * (right as number);
      case TokenType.GREATER:
        return (left as number) > (right as number);
      case TokenType.GREATER_EQUAL:
        return (left as number) >= (right as number);
      case TokenType.LESS:
        return (left as number) < (right as number);
      case TokenType.LESS_EQUAL:
        return (left as number) <= (right as number);
      case TokenType.BANG_EQUAL:
        return left !== right;
      case TokenType.EQUAL_EQUAL:
        return left === right;
    }
  }

  visitGroupingExpr(expr: Grouping): unknown {
    return this.evaluate(expr);
  }

  visitLiteralExpr(expr: Literal): unknown {
    return expr.value;
  }

  visitUnaryExpr(expr: Unary): unknown {
    const right = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case TokenType.BANG:
        return !this.isTruthy(right);
      case TokenType.MINUS:
        return -(right as number);
    }
  }

  private evaluate(expr: Expr): unknown {
    return expr.accept(this);
  }

  private isTruthy(object: unknown): boolean {
    if (object === null) return false;
    if (object instanceof Boolean) return object as boolean;
    return true;
  }
}
