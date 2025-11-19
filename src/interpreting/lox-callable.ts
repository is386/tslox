import { Interpreter } from './interpreter';

export interface LoxCallable {
  call(interpreter: Interpreter, args: unknown[]): unknown;
  arity(): number;
  toString(): string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isLoxCallable(value: any): value is LoxCallable {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof value.call === 'function' &&
    typeof value.arity === 'function' &&
    typeof value.toString === 'function'
  );
}
