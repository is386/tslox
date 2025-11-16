import { Token } from '../scanning/token';
import { RuntimeError } from './runtime-error';

export class Environment {
  values: Record<string, unknown> = {};

  define(name: string, value: unknown): void {
    this.values[name] = value;
  }

  get(name: Token) {
    if (this.values[name.lexeme]) {
      return this.values[name.lexeme];
    }
    throw new RuntimeError(name, `Undefined variable "${name.lexeme}".`);
  }

  assign(name: Token, value: unknown): void {
    if (this.values[name.lexeme]) {
      this.values[name.lexeme] = value;
      return;
    }
    throw new RuntimeError(name, `Undefined variable "${name.lexeme}".`);
  }
}
