# tslox

This is an interpreter for the Lox langauage developed in Typescript. I created this while reading the book Crafting Interpreters, which you can read for free [here](https://craftinginterpreters.com/)! I also have a few branches where I completed some of the coding challenges.

## Concepts and Language Features

- Tokens and lexing
- Abstract syntax trees (ASTs)
- Recursive descent parsing
- Prefix and infix expressions
- Runtime representation of objects
- Interpreting code using the Visitor pattern
- Lexical scope
- Environment chains for storing variables
- Control flow
- Functions with parameters
- Closures
- Static variable resolution and error detection
- Classes
- Constructors
- Fields
- Methods
- Inheritance

## Usage

- `npm run start <lox file>`: This will run your Lox program inside the interpreter
- `npm run start`: This will start the interpreter in REPL mode

## Example

### Input

```cpp
class Doughnut {
  cook() {
    print "Fry until golden brown.";
  }
}

class BostonCream < Doughnut {
  cook() {
    super.cook();
    print "Pipe full of custard and coat with chocolate.";
  }
}

BostonCream().cook();

for (var i = 0; i < 5; i = i + 1) {
  if (i == 2 or i == 4) {
    print i;
  }
}
```

### Output

```
Fry until golden brown.
Pipe full of custard and coat with chocolate.
2
4
```
