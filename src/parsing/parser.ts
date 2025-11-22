import { Token } from '../scanning/token';
import {
  AssignmentExpr,
  BinaryExpr,
  CallExpr,
  Expr,
  GetExpr,
  GroupingExpr,
  LiteralExpr,
  LogicalExpr,
  SetExpr,
  UnaryExpr,
  VariableExpr,
} from './expr';
import { TokenType } from '../scanning/token-type';
import { logError } from '../error';
import {
  BlockStmt,
  ClassStmt,
  ExpressionStmt,
  FunctionStmt,
  IfStmt,
  PrintStmt,
  ReturnStmt,
  Stmt,
  VarDeclStmt,
  WhileStmt,
} from './stmt';

export class Parser {
  private tokens: Token[];
  private current = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): Stmt[] {
    const stmts = [];

    while (!this.isAtEnd()) {
      const stmt = this.declaration();
      if (stmt !== null) {
        stmts.push(stmt);
      }
    }

    return stmts;
  }

  private declaration(): Stmt | null {
    try {
      if (this.match(TokenType.VAR)) return this.varDeclaration();
      return this.statement();
    } catch {
      this.synchronize();
      return null;
    }
  }

  private varDeclaration(): Stmt {
    const name = this.consume(TokenType.IDENTIFIER, 'Expect variable name.');

    let initializer = null;
    if (this.match(TokenType.EQUAL)) {
      initializer = this.expression();
    }

    this.consume(TokenType.SEMICOLON, "Expect ';' after variable declaration.");
    return new VarDeclStmt(name, initializer);
  }

  private statement(): Stmt {
    if (this.match(TokenType.PRINT)) return this.printStatement();
    if (this.match(TokenType.LEFT_BRACE))
      return new BlockStmt(this.blockStatement());
    if (this.match(TokenType.IF)) return this.ifStatement();
    if (this.match(TokenType.WHILE)) return this.whileStatement();
    if (this.match(TokenType.FOR)) return this.forStatement();
    if (this.match(TokenType.FUN)) return this.functionStatement('function');
    if (this.match(TokenType.RETURN)) return this.returnStatement();
    if (this.match(TokenType.CLASS)) return this.classStatement();

    return this.expressionStatement();
  }

  private printStatement(): Stmt {
    const expr = this.expression();
    this.consume(TokenType.SEMICOLON, "Expect ';' after value.");
    return new PrintStmt(expr);
  }

  private blockStatement(): Stmt[] {
    const stmts = [];

    while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      const stmt = this.declaration();
      if (stmt !== null) {
        stmts.push(stmt);
      }
    }

    this.consume(TokenType.RIGHT_BRACE, "Expect '}' after block.");

    return stmts;
  }

  private expressionStatement(): Stmt {
    const expr = this.expression();
    this.consume(TokenType.SEMICOLON, "Expect ';' after expression.");
    return new ExpressionStmt(expr);
  }

  private ifStatement(): Stmt {
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after if.");
    const condition = this.expression();
    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after '('.");

    const thenBranch = this.statement();

    let elseBranch = null;
    if (this.match(TokenType.ELSE)) {
      elseBranch = this.statement();
    }

    return new IfStmt(condition, thenBranch, elseBranch);
  }

  private functionStatement(kind: 'function' | 'method'): Stmt {
    const name = this.consume(TokenType.IDENTIFIER, `Expect ${kind} name.`);
    this.consume(TokenType.LEFT_PAREN, `Expect '(' after ${kind} name.`);

    const parameters = [];

    if (!this.check(TokenType.RIGHT_PAREN)) {
      do {
        if (parameters.length >= 255) {
          logError(this.peek().line, 'Cannot have more than 255 parameters.');
        }

        parameters.push(
          this.consume(TokenType.IDENTIFIER, 'Expect parameter name')
        );
      } while (this.match(TokenType.COMMA));
    }

    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after '('.");

    this.consume(TokenType.LEFT_BRACE, `Expect '{' before ${kind} body`);
    const body = this.blockStatement();

    return new FunctionStmt(name, parameters, body);
  }

  private returnStatement(): Stmt {
    const keyword = this.peekPrevious();

    let expr = null;
    if (!this.check(TokenType.SEMICOLON)) {
      expr = this.expression();
    }

    this.consume(TokenType.SEMICOLON, "Expect ';' after return value.");

    return new ReturnStmt(keyword, expr);
  }

  private whileStatement(): Stmt {
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after while.");
    const condition = this.expression();
    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after '('.");

    const body = this.statement();

    return new WhileStmt(condition, body);
  }

  private forStatement(): Stmt {
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after for.");

    let initializer: Stmt | null;
    if (this.match(TokenType.VAR)) {
      initializer = this.varDeclaration();
    } else if (this.match(TokenType.SEMICOLON)) {
      initializer = null;
    } else {
      initializer = this.expressionStatement();
    }

    let condition = null;
    if (!this.check(TokenType.SEMICOLON)) {
      condition = this.expression();
    }
    this.consume(TokenType.SEMICOLON, "Expect ';' after for condition.");

    let incrementer = null;
    if (!this.check(TokenType.RIGHT_PAREN)) {
      incrementer = this.expression();
    }
    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after '('.");

    let body = this.statement();

    if (incrementer !== null) {
      body = new BlockStmt([body, new ExpressionStmt(incrementer)]);
    }

    if (condition === null) {
      condition = new LiteralExpr(true);
    }

    body = new WhileStmt(condition, body);

    if (initializer !== null) {
      body = new BlockStmt([initializer, body]);
    }

    return body;
  }

  private classStatement(): Stmt {
    const name = this.consume(TokenType.IDENTIFIER, 'Expect class name.');
    this.consume(TokenType.LEFT_BRACE, "Expect '{' after class name.");

    const methods = [];
    while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      methods.push(this.functionStatement('method') as FunctionStmt);
    }

    this.consume(TokenType.RIGHT_BRACE, "Expect '}' after '{.");

    return new ClassStmt(name, methods);
  }

  private expression(): Expr {
    return this.assignment();
  }

  private assignment(): Expr {
    const expr = this.or();

    if (this.match(TokenType.EQUAL)) {
      const equal = this.peekPrevious();
      const value = this.assignment();

      if (expr instanceof VariableExpr) {
        const name = expr.name;
        return new AssignmentExpr(name, value);
      } else if (expr instanceof GetExpr) {
        return new SetExpr(expr.object, expr.name, value);
      }

      logError(equal.line, 'Invalid assignment target.');
    }

    return expr;
  }

  private or(): Expr {
    let expr = this.and();

    while (this.match(TokenType.OR)) {
      const operator = this.peekPrevious();
      const right = this.and();
      expr = new LogicalExpr(expr, operator, right);
    }

    return expr;
  }

  private and(): Expr {
    let expr = this.equality();

    while (this.match(TokenType.AND)) {
      const operator = this.peekPrevious();
      const right = this.equality();
      expr = new LogicalExpr(expr, operator, right);
    }

    return expr;
  }

  private equality(): Expr {
    let expr = this.comparison();

    while (this.match(TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL)) {
      const operator = this.peekPrevious();
      const right = this.comparison();
      expr = new BinaryExpr(expr, operator, right);
    }

    return expr;
  }

  private comparison(): Expr {
    let expr = this.term();

    while (
      this.match(
        TokenType.GREATER,
        TokenType.GREATER_EQUAL,
        TokenType.LESS,
        TokenType.LESS_EQUAL
      )
    ) {
      const operator = this.peekPrevious();
      const right = this.term();
      expr = new BinaryExpr(expr, operator, right);
    }

    return expr;
  }

  private term(): Expr {
    let expr = this.factor();

    while (this.match(TokenType.MINUS, TokenType.PLUS)) {
      const operator = this.peekPrevious();
      const right = this.factor();
      expr = new BinaryExpr(expr, operator, right);
    }

    return expr;
  }

  private factor(): Expr {
    let expr = this.unary();

    while (this.match(TokenType.SLASH, TokenType.STAR)) {
      const operator = this.peekPrevious();
      const right = this.unary();
      expr = new BinaryExpr(expr, operator, right);
    }

    return expr;
  }

  private unary(): Expr {
    while (this.match(TokenType.BANG, TokenType.MINUS)) {
      const operator = this.peekPrevious();
      const right = this.primary();
      return new UnaryExpr(operator, right);
    }

    return this.call();
  }

  private call(): Expr {
    let expr = this.primary();

    while (true) {
      if (this.match(TokenType.LEFT_PAREN)) {
        expr = this.finishCall(expr);
      } else if (this.match(TokenType.DOT)) {
        const name = this.consume(
          TokenType.IDENTIFIER,
          "Expect property name after '.'."
        );
        expr = new GetExpr(expr, name);
      } else {
        break;
      }
    }

    return expr;
  }

  private finishCall(callee: Expr): Expr {
    const args = [];

    if (!this.check(TokenType.RIGHT_PAREN)) {
      do {
        if (args.length >= 255) {
          logError(this.peek().line, 'Cannot have more than 255 arguments.');
        }
        args.push(this.expression());
      } while (this.match(TokenType.COMMA));
    }

    const paren = this.consume(
      TokenType.RIGHT_PAREN,
      "Expect ')' after arguments."
    );

    return new CallExpr(callee, paren, args);
  }

  private primary(): Expr {
    if (this.match(TokenType.FALSE)) {
      return new LiteralExpr(false);
    }

    if (this.match(TokenType.TRUE)) {
      return new LiteralExpr(true);
    }

    if (this.match(TokenType.NIL)) {
      return new LiteralExpr(null);
    }

    if (this.match(TokenType.NUMBER, TokenType.STRING)) {
      return new LiteralExpr(this.peekPrevious().literal);
    }

    if (this.match(TokenType.LEFT_PAREN)) {
      const expr = this.expression();
      this.consume(TokenType.RIGHT_PAREN, "Expect ')' after expression.");
      return new GroupingExpr(expr);
    }

    if (this.match(TokenType.IDENTIFIER)) {
      return new VariableExpr(this.peekPrevious());
    }

    logError(this.peek().line, 'Expect expression.');
    throw new Error();
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) {
      return this.advance();
    }

    const token = this.peek();
    const where = token.type === TokenType.EOF ? 'at end' : 'at';
    logError(token.line, message, where);
    throw new Error();
  }

  private synchronize(): void {
    this.advance();

    while (!this.isAtEnd()) {
      if (this.peekPrevious().type === TokenType.SEMICOLON) return;

      switch (this.peek().type) {
        case TokenType.CLASS:
        case TokenType.FUN:
        case TokenType.VAR:
        case TokenType.FOR:
        case TokenType.IF:
        case TokenType.WHILE:
        case TokenType.PRINT:
        case TokenType.RETURN:
          return;
      }

      this.advance();
    }
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private check(type: TokenType): boolean {
    return this.isAtEnd() ? false : this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) {
      this.current++;
    }
    return this.peekPrevious();
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private peekPrevious(): Token {
    return this.tokens[this.current - 1];
  }
}
