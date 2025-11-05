import { appendFileSync, writeFileSync } from 'fs';
import { exit } from 'process';

let path: string;

function main(): void {
  const args = process.argv;
  if (args.length != 3) {
    console.log('Usage: generate-ast <output_directory>');
    exit(64);
  }

  defineAst(args[2], 'Expr', [
    'Binary   : left: Expr, operator: Token, right: Expr',
    'Grouping : expression: Expr',
    'Literal  : value: unknown',
    'Unary    : operator: Token, right: Expr',
  ]);
}

function defineAst(outputDir: string, baseName: string, types: string[]): void {
  path = `${outputDir}/expr.ts`;

  // Imports
  writeFileSync(path, "import { Token } from '../scanning/token';\n\n", 'utf8');

  // Base Expression Class
  writeLine(`export class ${baseName} {`);
  writeLine();
  writeLine('}');
  writeLine();

  types.forEach((type) => {
    const className = type.split(' : ')[0].trim();
    const fields = type.split(' : ')[1].trim();
    defineType(baseName, className, fields);
  });
}

function defineType(
  baseName: string,
  className: string,
  fieldList: string
): void {
  // Sub Expression Classes
  writeLine(`export class ${className} extends ${baseName} {`);

  // Static Fields
  const fields = fieldList.split(', ');
  fields.forEach((field) => {
    writeLine(`  static ${field};`);
  });
  writeLine();

  // Constructor
  writeLine(`  constructor(${fieldList}) {`);
  writeLine('    super();');
  fields.forEach((field) => {
    const name = field.split(': ')[0];
    writeLine(`    ${className}.${name} = ${name};`);
  });
  writeLine('  }');

  writeLine('}');
  writeLine();
}

function writeLine(text?: string): void {
  appendFileSync(path, `${text ?? ''}\n`, 'utf8');
}

main();
