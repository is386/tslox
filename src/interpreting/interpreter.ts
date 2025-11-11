import { logError } from '../error';
import {
  Binary,
  Expr,
  Grouping,
  Literal,
  Unary,
  Visitor,
} from '../parsing/expr';
import { Token } from '../scanning/token';
import { TokenType } from '../scanning/token-type';
import { RuntimeError } from './runtime-error';

export class Interpreter implements Visitor<unknown> {
  interpret(expr: Expr): void {
    try {
      const value = this.evaluate(expr);
      console.log(JSON.stringify(value));
    } catch (e) {
      if (e instanceof RuntimeError) {
        logError(e.token.line, e.message);
      }
    }
  }

  visitBinaryExpr(expr: Binary): unknown {
    const left = this.evaluate(expr.left);
    const right = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case TokenType.MINUS:
        this.checkNumberOperands(expr.operator, left, right);
        return (left as number) - (right as number);

      case TokenType.PLUS:
        if (typeof left === 'number' && typeof right === 'number') {
          return left + right;
        }
        if (typeof left === 'string' && typeof right === 'string') {
          return left + right;
        }
        throw new RuntimeError(
          expr.operator,
          'Operands must be two numbers or two strings.'
        );

      case TokenType.SLASH:
        this.checkNumberOperands(expr.operator, left, right);
        if ((right as number) === 0) {
          throw new RuntimeError(expr.operator, 'Divide by zero.');
        }
        return (left as number) / (right as number);

      case TokenType.STAR:
        this.checkNumberOperands(expr.operator, left, right);
        return (left as number) * (right as number);

      case TokenType.GREATER:
        this.checkNumberOperands(expr.operator, left, right);
        return (left as number) > (right as number);

      case TokenType.GREATER_EQUAL:
        this.checkNumberOperands(expr.operator, left, right);
        return (left as number) >= (right as number);

      case TokenType.LESS:
        this.checkNumberOperands(expr.operator, left, right);
        return (left as number) < (right as number);

      case TokenType.LESS_EQUAL:
        this.checkNumberOperands(expr.operator, left, right);
        return (left as number) <= (right as number);

      case TokenType.BANG_EQUAL:
        return left !== right;

      case TokenType.EQUAL_EQUAL:
        return left === right;
    }
  }

  visitGroupingExpr(expr: Grouping): unknown {
    return this.evaluate(expr.expression);
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
        this.checkNumberOperand(expr.operator, right);
        return -(right as number);
    }
  }

  private evaluate(expr: Expr): unknown {
    return expr.accept(this);
  }

  private isTruthy(object: unknown): boolean {
    if (object === null) return false;
    if (typeof object === 'boolean') return object;
    return true;
  }

  private checkNumberOperand(operator: Token, operand: unknown): void {
    if (typeof operand !== 'number') {
      throw new RuntimeError(operator, 'Operand must be a number.');
    }
  }

  private checkNumberOperands(
    operator: Token,
    left: unknown,
    right: unknown
  ): void {
    if (typeof left !== 'number' || typeof right !== 'number') {
      throw new RuntimeError(operator, 'Operands must be numbers.');
    }
  }
}
