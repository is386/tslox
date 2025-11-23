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
  LogicalExpr,
  CallExpr,
  GetExpr,
  SetExpr,
  ThisExpr,
  SuperExpr,
} from '../parsing/expr';
import {
  BlockStmt,
  ClassStmt,
  ExpressionStmt,
  FunctionStmt,
  IfStmt,
  PrintStmt,
  ReturnStmt,
  Stmt,
  StmtVisitor,
  VarDeclStmt,
  WhileStmt,
} from '../parsing/stmt';
import { Token } from '../scanning/token';
import { TokenType } from '../scanning/token-type';
import { Environment } from './environment';
import { isLoxCallable, LoxCallable } from './lox-callable';
import { LoxClass } from './lox-class';
import { LoxFunction } from './lox-function';
import { LoxInstance } from './lox-instance';
import { Return } from './return';
import { RuntimeError } from './runtime-error';

export class Interpreter implements ExprVisitor<unknown>, StmtVisitor<void> {
  globals = new Environment();
  private environment: Environment = this.globals;
  private locals = new Map<Expr, number>();

  constructor() {
    this.globals.define('clock', {
      arity: () => 0,
      call: () => Date.now() / 1000,
      toString: () => '<native fn>',
    } as LoxCallable);
  }

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

  executeBlock(stmts: Stmt[], environment: Environment): void {
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

  resolve(expr: Expr, depth: number): void {
    this.locals.set(expr, depth);
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

  visitCallExpr(expr: CallExpr): unknown {
    const callee = this.evaluate(expr.callee);
    const args = expr.args.map((a) => this.evaluate(a));

    if (!isLoxCallable(callee)) {
      throw new RuntimeError(
        expr.paren,
        'Can only call functions and classes.'
      );
    }

    if (args.length != callee.arity()) {
      throw new RuntimeError(
        expr.paren,
        `Expected ${callee.arity()} arguments but got ${args.length}.`
      );
    }

    return callee.call(this, args);
  }

  visitAssignmentExpr(expr: AssignmentExpr): unknown {
    const value = this.evaluate(expr.value);

    const distance = this.locals.get(expr);
    if (distance !== undefined) {
      this.environment.assignAt(distance, expr.name, value);
    } else {
      this.globals.assign(expr.name, value);
    }

    return value;
  }

  visitVariableExpr(expr: VariableExpr): unknown {
    return this.lookUpVariable(expr.name, expr);
  }

  visitLogicalExpr(expr: LogicalExpr): unknown {
    const left = this.evaluate(expr.left);

    if (expr.operator.type === TokenType.OR) {
      if (this.isTruthy(left)) return left;
    } else {
      if (!this.isTruthy(left)) return left;
    }

    return this.evaluate(expr.right);
  }

  visitGetExpr(expr: GetExpr): unknown {
    const object = this.evaluate(expr.object);
    if (object instanceof LoxInstance) {
      return object.get(expr.name);
    }

    throw new RuntimeError(expr.name, 'Only instances have properties.');
  }

  visitSetExpr(expr: SetExpr): unknown {
    const object = this.evaluate(expr.object);
    if (!(object instanceof LoxInstance)) {
      throw new RuntimeError(expr.name, 'Only instances have fields.');
    }

    const value = this.evaluate(expr.value);
    object.set(expr.name, value);

    return value;
  }

  visitThisExpr(expr: ThisExpr): unknown {
    return this.lookUpVariable(expr.keyword, expr);
  }

  visitSuperExpr(expr: SuperExpr): unknown {
    const distance = this.locals.get(expr) ?? 0;
    const superclass = this.environment.getAt(distance, 'super') as LoxClass;
    const object = this.environment.getAt(distance - 1, 'this') as LoxInstance;
    const method = superclass.findMethod(expr.method.lexeme) as LoxFunction;

    if (method === null) {
      throw new RuntimeError(
        expr.method,
        "Undefined property '" + expr.method.lexeme + "'."
      );
    }

    return method.bind(object);
  }

  visitExpressionStmt(stmt: ExpressionStmt): void {
    this.evaluate(stmt.expr);
  }

  visitPrintStmt(stmt: PrintStmt): void {
    const value = this.evaluate(stmt.expr);

    let output: string;

    if (
      value &&
      typeof value.toString === 'function' &&
      value.toString !== Object.prototype.toString
    ) {
      output = value.toString();
    } else {
      try {
        output = JSON.stringify(value);
      } catch {
        output = String(value);
      }
    }

    console.log(output);
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

  visitIfStmt(stmt: IfStmt): void {
    if (this.isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.thenBranch);
    } else if (stmt.elseBranch !== null) {
      this.execute(stmt.elseBranch);
    }
  }

  visitWhileStmt(stmt: WhileStmt): void {
    while (this.isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.body);
    }
  }

  visitFunctionStmt(stmt: FunctionStmt): void {
    this.environment.define(
      stmt.name.lexeme,
      new LoxFunction(stmt, this.environment, false)
    );
  }

  visitReturnStmt(stmt: ReturnStmt): void {
    let value = null;
    if (stmt.expr != null) {
      value = this.evaluate(stmt.expr);
    }

    throw new Return(value);
  }

  visitClassStmt(stmt: ClassStmt): void {
    let superclass = null;
    if (stmt.superclass !== null) {
      superclass = this.evaluate(stmt.superclass);
      if (!(superclass instanceof LoxClass)) {
        throw new RuntimeError(
          stmt.superclass.name,
          'Superclass must be a class.'
        );
      }
    }

    this.environment.define(stmt.name.lexeme, null);

    if (stmt.superclass !== null) {
      this.environment = new Environment(this.environment);
      this.environment.define('super', superclass);
    }

    const methods: Record<string, LoxFunction> = {};
    stmt.methods.forEach((m) => {
      const func = new LoxFunction(
        m,
        this.environment,
        m.name.lexeme === 'init'
      );
      methods[m.name.lexeme] = func;
    });

    const klass = new LoxClass(stmt.name.lexeme, superclass, methods);

    if (superclass != null) {
      this.environment = this.environment.enclosing as Environment;
    }

    this.environment.assign(stmt.name, klass);
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

  private lookUpVariable(name: Token, expr: Expr): unknown {
    const distance = this.locals.get(expr);
    if (distance !== undefined) {
      return this.environment.getAt(distance, name.lexeme);
    }
    return this.globals.get(name);
  }
}
