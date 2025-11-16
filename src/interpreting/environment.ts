import { Token } from '../scanning/token';
import { RuntimeError } from './runtime-error';

export class Environment {
  values: Record<string, unknown> = {};
  enclosing: Environment | null;

  constructor(enclosing?: Environment) {
    this.enclosing = enclosing ?? null;
  }

  define(name: string, value: unknown): void {
    this.values[name] = value;
  }

  get(name: Token): unknown {
    if (this.values[name.lexeme]) {
      return this.values[name.lexeme];
    }

    if (this.enclosing) {
      return this.enclosing.get(name);
    }

    throw new RuntimeError(name, `Undefined variable "${name.lexeme}".`);
  }

  assign(name: Token, value: unknown): void {
    if (this.values[name.lexeme]) {
      this.values[name.lexeme] = value;
      return;
    }

    if (this.enclosing) {
      this.enclosing.assign(name, value);
      return;
    }

    throw new RuntimeError(name, `Undefined variable "${name.lexeme}".`);
  }
}
