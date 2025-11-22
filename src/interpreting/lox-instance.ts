import { Token } from '../scanning/token';
import { LoxClass } from './lox-class';
import { RuntimeError } from './runtime-error';

export class LoxInstance {
  private klass: LoxClass;
  private fields: Record<string, unknown> = {};

  constructor(klass: LoxClass) {
    this.klass = klass;
  }

  get(name: Token): unknown {
    if (this.fields[name.lexeme]) {
      return this.fields[name.lexeme];
    }

    throw new RuntimeError(name, "Undefined property '" + name.lexeme + "'.");
  }

  set(name: Token, value: unknown): void {
    this.fields[name.lexeme] = value;
  }

  toString() {
    return this.klass.name + ' instance';
  }
}
