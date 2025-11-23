import { FunctionStmt } from '../parsing/stmt';
import { Environment } from './environment';
import { Interpreter } from './interpreter';
import { LoxCallable } from './lox-callable';
import { LoxInstance } from './lox-instance';
import { Return } from './return';

export class LoxFunction implements LoxCallable {
  private declaration: FunctionStmt;
  private closure: Environment;
  private isInitializer: boolean;

  constructor(
    declaration: FunctionStmt,
    closure: Environment,
    isInitializer: boolean
  ) {
    this.declaration = declaration;
    this.closure = closure;
    this.isInitializer = isInitializer;
  }

  call(interpreter: Interpreter, args: unknown[]): unknown {
    const environment = new Environment(this.closure);

    this.declaration.params.forEach((p, i) => {
      environment.define(p.lexeme, args[i]);
    });

    try {
      interpreter.executeBlock(this.declaration.body, environment);
    } catch (e) {
      if (e instanceof Return) {
        if (this.isInitializer) return this.closure.getAt(0, 'this');
        return e.value;
      }
    }

    if (this.isInitializer) return this.closure.getAt(0, 'this');
    return null;
  }

  arity(): number {
    return this.declaration.params.length;
  }

  bind(instance: LoxInstance): LoxFunction {
    const environment = new Environment(this.closure);
    environment.define('this', instance);
    return new LoxFunction(this.declaration, environment, this.isInitializer);
  }

  toString(): string {
    return `<${this.declaration.name.lexeme}>`;
  }
}
