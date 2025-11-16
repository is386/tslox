import { appendFileSync, writeFileSync } from 'fs';
import { exit } from 'process';

let path: string;

function main(): void {
  const args = process.argv;
  if (args.length !== 3) {
    console.log('Usage: generate-ast <output_directory>');
    exit(64);
  }

  defineAst(args[2], 'Expr', [
    'Binary   # left: Expr, operator: Token, right: Expr',
    'Grouping # expression: Expr',
    'Literal  # value: unknown',
    'Unary    # operator: Token, right: Expr',
    'Variable # name: Token',
    'Assignment # name: Token, value: Expr',
  ]);

  defineAst(args[2], 'Stmt', [
    'Block      # stmts: Stmt[]',
    'Expression # expr: Expr',
    'Print      # expr: Expr',
    'VarDecl    # name: Token, initializer: Expr | null',
  ]);
}

function defineAst(
  outputDir: string,
  baseName: 'Expr' | 'Stmt',
  types: string[]
): void {
  path = `${outputDir}/${baseName.toLowerCase()}.ts`;

  // Imports
  writeFileSync(path, "import { Token } from '../scanning/token';\n", 'utf8');
  if (baseName == 'Stmt') {
    writeLine("import { Expr } from './expr';");
    writeLine();
  }

  // Visitor
  defineVisitor(baseName, types);
  writeLine();

  // Base Expression Class
  writeLine(`export abstract class ${baseName} {`);
  writeLine(`abstract accept<R>(visitor: ${baseName}Visitor<R>): R;`);
  writeLine('}');
  writeLine();

  types.forEach((type) => {
    const className = type.split('#')[0].trim();
    const fields = type.split('#')[1].trim();
    defineType(baseName, className, fields);
  });
}

function defineVisitor(baseName: string, types: string[]): void {
  writeLine(`export interface ${baseName}Visitor<R> {`);
  types.forEach((type) => {
    const typeName = type.split('#')[0].trim();
    writeLine(
      `visit${typeName}${baseName}(${baseName.toLowerCase()}: ${typeName}${baseName}): R;`
    );
  });
  writeLine('}');
}

function defineType(
  baseName: string,
  className: string,
  fieldList: string
): void {
  // Sub Expression Classes
  writeLine(`export class ${className}${baseName} extends ${baseName} {`);

  // Static Fields
  const fields = fieldList.split(', ');
  fields.forEach((field) => {
    writeLine(`${field};`);
  });
  writeLine();

  // Constructor
  writeLine(`constructor(${fieldList}) {`);
  writeLine('super();');
  fields.forEach((field) => {
    const name = field.split(': ')[0];
    writeLine(`this.${name} = ${name};`);
  });
  writeLine('}');
  writeLine();

  // Visitor Pattern
  writeLine(`accept<R>(visitor: ${baseName}Visitor<R>): R {`);
  writeLine(`return visitor.visit${className}${baseName}(this);`);
  writeLine('}');

  writeLine('}');
  writeLine();
}

function writeLine(text?: string): void {
  appendFileSync(path, `${text ?? ''}\n`, 'utf8');
}

main();
