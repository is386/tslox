import { Interpreter } from './interpreter';
import { LoxCallable } from './lox-callable';
import { LoxInstance } from './lox-instance';

export class LoxClass implements LoxCallable {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  call(interpreter: Interpreter, args: unknown[]): unknown {
    return new LoxInstance(this);
  }

  arity(): number {
    return 0;
  }

  toString(): string {
    return this.name;
  }
}
