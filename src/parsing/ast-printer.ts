import {
  BinaryExpr,
  Expr,
  GroupingExpr,
  LiteralExpr,
  UnaryExpr,
  ExprVisitor,
} from './expr';

export class AstPrinter implements ExprVisitor<string> {
  print(expr: Expr) {
    return expr.accept(this);
  }

  visitBinaryExpr(expr: BinaryExpr): string {
    return this.parenthesize(expr.operator.lexeme, expr.left, expr.right);
  }

  visitGroupingExpr(expr: GroupingExpr): string {
    return this.parenthesize('group', expr.expression);
  }

  visitLiteralExpr(expr: LiteralExpr): string {
    if (!expr.value) {
      return 'nil';
    }
    return expr.value as string;
  }

  visitUnaryExpr(expr: UnaryExpr): string {
    return this.parenthesize(expr.operator.lexeme, expr.right);
  }

  private parenthesize(name: string, ...exprs: Expr[]): string {
    return `(${[name, ...exprs.map((e) => e.accept(this))].join(' ')})`;
  }
}
