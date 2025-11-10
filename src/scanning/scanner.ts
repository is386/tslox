import { logError } from '../error';
import { Token } from './token';
import { TokenType } from './token-type';

export class Scanner {
  private source: string;
  private tokens: Token[] = [];
  private start = 0;
  private current = 0;
  private line = 1;

  private keywords: Record<string, TokenType> = {
    and: TokenType.AND,
    class: TokenType.CLASS,
    else: TokenType.ELSE,
    false: TokenType.FALSE,
    for: TokenType.FOR,
    fun: TokenType.FUN,
    if: TokenType.IF,
    nil: TokenType.NIL,
    or: TokenType.OR,
    print: TokenType.PRINT,
    return: TokenType.RETURN,
    super: TokenType.SUPER,
    this: TokenType.THIS,
    true: TokenType.TRUE,
    var: TokenType.VAR,
    while: TokenType.WHILE,
  };

  constructor(source: string) {
    this.source = source;
  }

  scanTokens(): Token[] {
    while (!this.isAtEnd()) {
      this.start = this.current;
      this.scanToken();
    }

    this.tokens.push(new Token(TokenType.EOF, '', null, this.line));
    return this.tokens;
  }

  private isAtEnd(): boolean {
    return this.current >= this.source.length;
  }

  private scanToken(): void {
    const char = this.advance();
    switch (char) {
      case '(':
        this.addToken(TokenType.LEFT_PAREN);
        break;
      case ')':
        this.addToken(TokenType.RIGHT_PAREN);
        break;
      case '{':
        this.addToken(TokenType.LEFT_BRACE);
        break;
      case '}':
        this.addToken(TokenType.RIGHT_BRACE);
        break;
      case ',':
        this.addToken(TokenType.COMMA);
        break;
      case '.':
        this.addToken(TokenType.DOT);
        break;
      case '-':
        this.addToken(TokenType.MINUS);
        break;
      case '+':
        this.addToken(TokenType.PLUS);
        break;
      case ';':
        this.addToken(TokenType.SEMICOLON);
        break;
      case '*':
        this.addToken(TokenType.STAR);
        break;
      case '!':
        this.addToken(
          this.advanceIfMatch('=') ? TokenType.BANG_EQUAL : TokenType.BANG
        );
        break;
      case '=':
        this.addToken(
          this.advanceIfMatch('=') ? TokenType.EQUAL_EQUAL : TokenType.EQUAL
        );
        break;
      case '<':
        this.addToken(
          this.advanceIfMatch('=') ? TokenType.LESS_EQUAL : TokenType.LESS
        );
        break;
      case '>':
        this.addToken(
          this.advanceIfMatch('=') ? TokenType.GREATER_EQUAL : TokenType.GREATER
        );
        break;
      case '/':
        this.scanSlash();
        break;
      case ' ':
      case '\r':
      case '\t':
        break;
      case '\n':
        this.line++;
        break;
      case '"':
        this.scanString();
        break;
      default:
        if (this.isDigit(char)) {
          this.scanNumber();
        } else if (this.isAlpha(char)) {
          this.scanIdentifier();
        } else {
          logError(this.line, 'Unexpected character.');
        }
        break;
    }
  }

  private advance(): string {
    return this.source.charAt(this.current++);
  }

  private advanceIfMatch(char: string) {
    if (this.isAtEnd()) {
      return false;
    }
    if (this.source.charAt(this.current) !== char) {
      return false;
    }

    this.advance();
    return true;
  }

  private peek(): string {
    return this.isAtEnd() ? '\0' : this.source.charAt(this.current);
  }

  private peekNext(): string {
    return this.current + 1 >= this.source.length
      ? '\0'
      : this.source.charAt(this.current + 1);
  }

  private addToken(type: TokenType, literal?: unknown): void {
    const lexeme = this.source.substring(this.start, this.current);
    this.tokens.push(new Token(type, lexeme, literal, this.line));
  }

  private scanSlash(): void {
    if (this.advanceIfMatch('/')) {
      while (this.peek() !== '\n' && !this.isAtEnd()) {
        this.advance();
      }
      return;
    }
    this.addToken(TokenType.SLASH);
  }

  private scanString(): void {
    while (this.peek() !== '"' && !this.isAtEnd()) {
      if (this.peek() === '\n') {
        this.line++;
      }
      this.advance();
    }

    if (this.isAtEnd()) {
      logError(this.line, 'Unterminated string.');
      return;
    }

    this.advance();

    const str = this.source.substring(this.start + 1, this.current - 1);
    this.addToken(TokenType.STRING, str);
  }

  private scanNumber(): void {
    while (this.isDigit(this.peek())) {
      this.advance();
    }

    if (this.peek() === '.' && this.isDigit(this.peekNext())) {
      this.advance();
      while (this.isDigit(this.peek())) {
        this.advance();
      }
    }

    const num = this.source.substring(this.start, this.current);
    this.addToken(TokenType.NUMBER, num);
  }

  private scanIdentifier(): void {
    while (this.isAlphaNumeric(this.peek())) {
      this.advance();
    }

    const identifier = this.source.substring(this.start, this.current);
    const type = this.keywords[identifier] ?? TokenType.IDENTIFIER;
    this.addToken(type);
  }

  private isAlpha(char: string): boolean {
    return (
      (char >= 'a' && char <= 'z') ||
      (char >= 'A' && char <= 'Z') ||
      char === '_'
    );
  }

  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }

  private isAlphaNumeric(char: string): boolean {
    return this.isAlpha(char) || this.isDigit(char);
  }
}
