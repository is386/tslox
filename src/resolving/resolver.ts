import { Interpreter } from '../interpreting/interpreter';
import {
  AssignmentExpr,
  BinaryExpr,
  CallExpr,
  Expr,
  ExprVisitor,
  GetExpr,
  GroupingExpr,
  LiteralExpr,
  LogicalExpr,
  SetExpr,
  SuperExpr,
  ThisExpr,
  UnaryExpr,
  VariableExpr,
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
import { logError } from '../error';

enum FunctionType {
  NONE,
  FUNCTION,
  METHOD,
  INITIALIZER,
}

enum ClassType {
  NONE,
  CLASS,
  SUBCLASS,
}

export class Resolver implements ExprVisitor<void>, StmtVisitor<void> {
  private interpreter: Interpreter;
  private scopes: Record<string, boolean>[] = [];
  private currentFunction: FunctionType = FunctionType.NONE;
  private currentClass: ClassType = ClassType.NONE;

  constructor(interpreter: Interpreter) {
    this.interpreter = interpreter;
  }

  resolveList(x: Stmt[] | Expr[]): void {
    x.forEach((y) => this.resolve(y));
  }

  visitBlockStmt(stmt: BlockStmt): void {
    this.beginScope();
    this.resolveList(stmt.stmts);
    this.endScope();
  }

  visitVarDeclStmt(stmt: VarDeclStmt): void {
    this.declare(stmt.name);
    if (stmt.initializer !== null) {
      this.resolve(stmt.initializer);
    }
    this.define(stmt.name);
  }

  visitFunctionStmt(stmt: FunctionStmt): void {
    this.declare(stmt.name);
    this.define(stmt.name);
    this.resolveFunction(stmt, FunctionType.FUNCTION);
  }

  visitVariableExpr(expr: VariableExpr): void {
    const scope = this.scopes[this.scopes.length - 1];

    if (this.scopes.length > 0 && scope[expr.name.lexeme] === false) {
      logError(
        expr.name.line,
        "Can't read local variable in its own initializer"
      );
    }

    this.resolveLocal(expr, expr.name);
  }

  visitAssignmentExpr(expr: AssignmentExpr): void {
    this.resolve(expr.value);
    this.resolveLocal(expr, expr.name);
  }

  visitSuperExpr(expr: SuperExpr): void {
    if (this.currentClass == ClassType.NONE) {
      logError(expr.keyword.line, "Can't use 'super' outside of a class.");
    } else if (this.currentClass != ClassType.SUBCLASS) {
      logError(
        expr.keyword.line,
        "Can't use 'super' in a class with no superclass."
      );
    }

    this.resolveLocal(expr, expr.keyword);
  }

  visitExpressionStmt(stmt: ExpressionStmt): void {
    this.resolve(stmt.expr);
  }

  visitPrintStmt(stmt: PrintStmt): void {
    this.resolve(stmt.expr);
  }

  visitIfStmt(stmt: IfStmt): void {
    this.resolve(stmt.condition);
    this.resolve(stmt.thenBranch);
    if (stmt.elseBranch !== null) this.resolve(stmt.elseBranch);
  }

  visitWhileStmt(stmt: WhileStmt): void {
    this.resolve(stmt.condition);
    this.resolve(stmt.body);
  }

  visitReturnStmt(stmt: ReturnStmt): void {
    if (this.currentFunction == FunctionType.NONE) {
      logError(stmt.keyword.line, "Can't return from top-level code.");
    }

    if (stmt.expr !== null) {
      if (this.currentFunction == FunctionType.INITIALIZER) {
        logError(
          stmt.keyword.line,
          "Can't return a value from an initializer."
        );
      }
      this.resolve(stmt.expr);
    }
  }

  visitClassStmt(stmt: ClassStmt): void {
    const enclosingClass = this.currentClass;
    this.currentClass = ClassType.CLASS;

    this.declare(stmt.name);
    this.define(stmt.name);

    if (
      stmt.superclass !== null &&
      stmt.name.lexeme === stmt.superclass.name.lexeme
    ) {
      logError(stmt.superclass.name, 'A class cannot inherit from itself.');
    }

    if (stmt.superclass !== null) {
      this.currentClass = ClassType.SUBCLASS;
      this.resolve(stmt.superclass);
    }

    if (stmt.superclass != null) {
      this.beginScope();
      this.scopes[this.scopes.length - 1]['super'] = true;
    }

    this.beginScope();
    this.scopes[this.scopes.length - 1]['this'] = true;

    stmt.methods.forEach((m) => {
      let declaration = FunctionType.METHOD;

      if (m.name.lexeme === 'init') {
        declaration = FunctionType.INITIALIZER;
      }

      this.resolveFunction(m, declaration);
    });

    this.endScope();

    if (stmt.superclass != null) this.endScope();

    this.currentClass = enclosingClass;
  }

  visitSetExpr(expr: SetExpr): void {
    this.resolve(expr.value);
    this.resolve(expr.object);
  }

  visitGetExpr(expr: GetExpr): void {
    this.resolve(expr.object);
  }

  visitBinaryExpr(expr: BinaryExpr): void {
    this.resolve(expr.left);
    this.resolve(expr.right);
  }

  visitLogicalExpr(expr: LogicalExpr): void {
    this.resolve(expr.left);
    this.resolve(expr.right);
  }

  visitGroupingExpr(expr: GroupingExpr): void {
    this.resolve(expr.expression);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  visitLiteralExpr(expr: LiteralExpr): void {}

  visitUnaryExpr(expr: UnaryExpr): void {
    this.resolve(expr.right);
  }

  visitCallExpr(expr: CallExpr): void {
    this.resolve(expr.callee);
    expr.args.forEach((a) => this.resolve(a));
  }

  visitThisExpr(expr: ThisExpr): void {
    if (this.currentClass == ClassType.NONE) {
      logError(expr.keyword.line, "Can't use 'this' outside of a class.");
      return;
    }

    this.resolveLocal(expr, expr.keyword);
  }

  private resolve(x: Stmt | Expr): void {
    x.accept(this);
  }

  private resolveLocal(expr: Expr, name: Token): void {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      if (this.scopes[i][name.lexeme]) {
        this.interpreter.resolve(expr, this.scopes.length - 1 - i);
        return;
      }
    }
  }

  private resolveFunction(func: FunctionStmt, funcType: FunctionType): void {
    const enclosingFunction = this.currentFunction;
    this.currentFunction = funcType;

    this.beginScope();

    func.params.forEach((p) => {
      this.declare(p);
      this.define(p);
    });

    this.resolveList(func.body);

    this.endScope();
    this.currentFunction = enclosingFunction;
  }

  private beginScope(): void {
    this.scopes.push({});
  }

  private endScope(): void {
    this.scopes.pop();
  }

  private declare(name: Token): void {
    if (this.scopes.length === 0) return;

    const scope = this.scopes[this.scopes.length - 1];

    if (scope[name.lexeme]) {
      logError(name.line, 'Already a variable with this name in this scope.');
    }

    scope[name.lexeme] = false;
  }

  private define(name: Token): void {
    if (this.scopes.length === 0) return;

    const scope = this.scopes[this.scopes.length - 1];
    scope[name.lexeme] = true;
  }
}
