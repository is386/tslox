import { readFileSync } from 'fs';
import { exit } from 'process';
import { createInterface } from 'readline';
import { clearError, hadError } from './error';
import { Scanner } from './scanning/scanner';
import { Parser } from './parsing/parser';
import { AstPrinter } from './parsing/ast-printer';

function main(): void {
  const args = process.argv;

  if (args.length > 3) {
    console.log('Usage: tslox [script]');
    exit(64);
  } else if (args.length === 3) {
    runFile(args[2]);
  } else {
    runPrompt();
  }
}

function runFile(path: string): void {
  const fileContent = readFileSync(path, { encoding: 'utf-8' });
  run(fileContent);
  if (hadError()) exit(65);
}

async function runPrompt(): Promise<void> {
  while (true) {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const line = await new Promise<string>((resolve) => {
      rl.question('> ', (answer) => {
        rl.close();
        resolve(answer);
      });
    });

    if (!line) break;
    run(line);
    clearError();
  }
}

function run(source: string): void {
  const scanner = new Scanner(source);
  const tokens = scanner.scanTokens();

  const parser = new Parser(tokens);
  const expr = parser.parse();

  if (hadError() || !expr) return;

  console.log(new AstPrinter().print(expr));
}

main();
