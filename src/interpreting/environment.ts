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
    if (this.exists(name)) {
      return this.values[name.lexeme];
    }

    if (this.enclosing) {
      return this.enclosing.get(name);
    }

    throw new RuntimeError(name, `Undefined variable "${name.lexeme}".`);
  }

  getAt(distance: number, name: string): unknown {
    return this.ancestor(distance).values[name];
  }

  assign(name: Token, value: unknown): void {
    if (this.exists(name)) {
      this.values[name.lexeme] = value;
      return;
    }

    if (this.enclosing) {
      this.enclosing.assign(name, value);
      return;
    }

    throw new RuntimeError(name, `Undefined variable "${name.lexeme}".`);
  }

  assignAt(distance: number, name: Token, value: unknown): void {
    this.ancestor(distance).values[name.lexeme] = value;
  }

  private exists(name: Token): boolean {
    return Object.keys(this.values).includes(name.lexeme);
  }

  private ancestor(distance: number): Environment {
    let environment = this as Environment;
    for (let i = 0; i < distance; i++) {
      if (environment.enclosing) {
        environment = environment.enclosing;
      }
    }
    return environment;
  }
}
