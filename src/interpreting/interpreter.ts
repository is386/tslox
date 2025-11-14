import { logError } from '../error';
import {
  BinaryExpr,
  Expr,
  GroupingExpr,
  LiteralExpr,
  UnaryExpr,
  ExprVisitor,
} from '../parsing/expr';
import { ExpressionStmt, PrintStmt, Stmt, StmtVisitor } from '../parsing/stmt';
import { Token } from '../scanning/token';
import { TokenType } from '../scanning/token-type';
import { RuntimeError } from './runtime-error';

export class Interpreter implements ExprVisitor<unknown>, StmtVisitor<void> {
  interpret(stmts: Stmt[]): void {
    try {
      stmts.forEach((s) => {
        this.execute(s);
      });
    } catch (e) {
      if (e instanceof RuntimeError) {
        logError(e.token.line, e.message);
      }
    }
  }

  visitBinaryExpr(expr: BinaryExpr): unknown {
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

  visitGroupingExpr(expr: GroupingExpr): unknown {
    return this.evaluate(expr.expression);
  }

  visitLiteralExpr(expr: LiteralExpr): unknown {
    return expr.value;
  }

  visitUnaryExpr(expr: UnaryExpr): unknown {
    const right = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case TokenType.BANG:
        return !this.isTruthy(right);
      case TokenType.MINUS:
        this.checkNumberOperand(expr.operator, right);
        return -(right as number);
    }
  }

  private execute(stmt: Stmt): void {
    stmt.accept(this);
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

  visitExpressionStmt(stmt: ExpressionStmt): void {
    this.evaluate(stmt.expr);
  }

  visitPrintStmt(stmt: PrintStmt): void {
    const value = this.evaluate(stmt.expr);
    console.log(JSON.stringify(value));
  }
}
