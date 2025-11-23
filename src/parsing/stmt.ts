import { Token } from '../scanning/token';
import { Expr } from './expr';

export interface StmtVisitor<R> {
  visitBlockStmt(stmt: BlockStmt): R;
  visitExpressionStmt(stmt: ExpressionStmt): R;
  visitPrintStmt(stmt: PrintStmt): R;
  visitVarDeclStmt(stmt: VarDeclStmt): R;
  visitIfStmt(stmt: IfStmt): R;
  visitWhileStmt(stmt: WhileStmt): R;
  visitFunctionStmt(stmt: FunctionStmt): R;
  visitReturnStmt(stmt: ReturnStmt): R;
  visitClassStmt(stmt: ClassStmt): R;
}

export abstract class Stmt {
  abstract accept<R>(visitor: StmtVisitor<R>): R;
}

export class BlockStmt extends Stmt {
  stmts: Stmt[];

  constructor(stmts: Stmt[]) {
    super();
    this.stmts = stmts;
  }

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitBlockStmt(this);
  }
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

export class IfStmt extends Stmt {
  condition: Expr;
  thenBranch: Stmt;
  elseBranch: Stmt | null;

  constructor(condition: Expr, thenBranch: Stmt, elseBranch: Stmt | null) {
    super();
    this.condition = condition;
    this.thenBranch = thenBranch;
    this.elseBranch = elseBranch;
  }

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitIfStmt(this);
  }
}

export class WhileStmt extends Stmt {
  condition: Expr;
  body: Stmt;

  constructor(condition: Expr, body: Stmt) {
    super();
    this.condition = condition;
    this.body = body;
  }

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitWhileStmt(this);
  }
}

export class FunctionStmt extends Stmt {
  name: Token;
  params: Token[];
  body: Stmt[];

  constructor(name: Token, params: Token[], body: Stmt[]) {
    super();
    this.name = name;
    this.params = params;
    this.body = body;
  }

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitFunctionStmt(this);
  }
}

export class ReturnStmt extends Stmt {
  keyword: Token;
  expr: Expr | null;

  constructor(keyword: Token, expr: Expr | null) {
    super();
    this.keyword = keyword;
    this.expr = expr;
  }

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitReturnStmt(this);
  }
}

export class ClassStmt extends Stmt {
  name: Token;
  superclass: VariableExpr | null;
  methods: FunctionStmt[];

  constructor(
    name: Token,
    superclass: VariableExpr | null,
    methods: FunctionStmt[]
  ) {
    super();
    this.name = name;
    this.superclass = superclass;
    this.methods = methods;
  }

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitClassStmt(this);
  }
}
