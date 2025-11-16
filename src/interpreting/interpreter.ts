import { logError } from '../error';
import {
  BinaryExpr,
  Expr,
  GroupingExpr,
  LiteralExpr,
  UnaryExpr,
  ExprVisitor,
  VariableExpr,
  AssignmentExpr,
} from '../parsing/expr';
import {
  BlockStmt,
  ExpressionStmt,
  PrintStmt,
  Stmt,
  StmtVisitor,
  VarDeclStmt,
} from '../parsing/stmt';
import { Token } from '../scanning/token';
import { TokenType } from '../scanning/token-type';
import { Environment } from './environment';
import { RuntimeError } from './runtime-error';

export class Interpreter implements ExprVisitor<unknown>, StmtVisitor<void> {
  private environment = new Environment();

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

  visitAssignmentExpr(expr: AssignmentExpr): unknown {
    const value = this.evaluate(expr.value);
    this.environment.assign(expr.name, value);
    return value;
  }

  visitVariableExpr(expr: VariableExpr): unknown {
    return this.environment.get(expr.name);
  }

  visitExpressionStmt(stmt: ExpressionStmt): void {
    this.evaluate(stmt.expr);
  }

  visitPrintStmt(stmt: PrintStmt): void {
    const value = this.evaluate(stmt.expr);
    console.log(JSON.stringify(value));
  }

  visitBlockStmt(stmt: BlockStmt): void {
    this.executeBlock(stmt.stmts, new Environment(this.environment));
  }

  visitVarDeclStmt(stmt: VarDeclStmt): void {
    let value = null;
    if (stmt.initializer != null) {
      value = this.evaluate(stmt.initializer);
    }

    this.environment.define(stmt.name.lexeme, value);
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

  private executeBlock(stmts: Stmt[], environment: Environment): void {
    const previous = this.environment;

    try {
      this.environment = environment;
      stmts.forEach((s) => {
        this.execute(s);
      });
    } finally {
      this.environment = previous;
    }
  }
}
