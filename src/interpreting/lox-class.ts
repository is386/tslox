import { Interpreter } from './interpreter';
import { LoxCallable } from './lox-callable';
import { LoxFunction } from './lox-function';
import { LoxInstance } from './lox-instance';

export class LoxClass implements LoxCallable {
  name: string;
  private methods: Record<string, LoxFunction>;

  constructor(name: string, methods: Record<string, LoxFunction>) {
    this.name = name;
    this.methods = methods;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  call(interpreter: Interpreter, args: unknown[]): unknown {
    return new LoxInstance(this);
  }

  arity(): number {
    return 0;
  }

  findMethod(name: string): LoxFunction | null {
    return this.methods[name] ?? null;
  }

  toString(): string {
    return this.name;
  }
}
