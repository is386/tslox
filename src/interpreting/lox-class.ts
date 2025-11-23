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

  call(interpreter: Interpreter, args: unknown[]): unknown {
    const instance = new LoxInstance(this);

    const initializer = this.findMethod('init');
    if (initializer !== null) {
      initializer.bind(instance).call(interpreter, args);
    }

    return instance;
  }

  arity(): number {
    const initializer = this.findMethod('init');
    if (initializer == null) return 0;
    return initializer.arity();
  }

  findMethod(name: string): LoxFunction | null {
    return this.methods[name] ?? null;
  }

  toString(): string {
    return this.name;
  }
}
