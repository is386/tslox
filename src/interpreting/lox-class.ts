import { Interpreter } from './interpreter';
import { LoxCallable } from './lox-callable';
import { LoxFunction } from './lox-function';
import { LoxInstance } from './lox-instance';

export class LoxClass implements LoxCallable {
  name: string;
  superclass: LoxClass | null;
  private methods: Record<string, LoxFunction>;

  constructor(
    name: string,
    superclass: LoxClass | null,
    methods: Record<string, LoxFunction>
  ) {
    this.name = name;
    this.superclass = superclass;
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
    if (this.methods[name]) {
      return this.methods[name];
    }

    if (this.superclass !== null) {
      return this.superclass.findMethod(name);
    }

    return null;
  }

  toString(): string {
    return this.name;
  }
}
