import { FunctionStmt } from '../parsing/stmt';
import { Environment } from './environment';
import { Interpreter } from './interpreter';
import { LoxCallable } from './lox-callable';

export class LoxFunction implements LoxCallable {
  private declaration: FunctionStmt;

  constructor(declaration: FunctionStmt) {
    this.declaration = declaration;
  }

  call(interpreter: Interpreter, args: unknown[]): unknown {
    const environment = new Environment(interpreter.globals);

    this.declaration.params.forEach((p, i) => {
      environment.define(p.lexeme, args[i]);
    });

    interpreter.executeBlock(this.declaration.body, environment);
    return null;
  }

  arity(): number {
    return this.declaration.params.length;
  }

  toString(): string {
    return `<${this.declaration.name.lexeme}>`;
  }
}
