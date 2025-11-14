import { Token } from '../scanning/token';
import { Expr } from './expr';

export interface StmtVisitor<R> {
  visitExpressionStmt(stmt: ExpressionStmt): R;
  visitPrintStmt(stmt: PrintStmt): R;
  visitVarDeclStmt(stmt: VarDeclStmt): R;
}

export abstract class Stmt {
  abstract accept<R>(visitor: StmtVisitor<R>): R;
}

export class ExpressionStmt extends Stmt {
  expr: Expr;

  constructor(expr: Expr) {
    super();
    this.expr = expr;
  }

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitExpressionStmt(this);
  }
}

export class PrintStmt extends Stmt {
  expr: Expr;

  constructor(expr: Expr) {
    super();
    this.expr = expr;
  }

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitPrintStmt(this);
  }
}

export class VarDeclStmt extends Stmt {
  name: Token;
  initializer: Expr | null;

  constructor(name: Token, initializer: Expr | null) {
    super();
    this.name = name;
    this.initializer = initializer;
  }

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitVarDeclStmt(this);
  }
}
