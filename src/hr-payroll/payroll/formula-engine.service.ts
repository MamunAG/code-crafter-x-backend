import { BadRequestException, Injectable } from '@nestjs/common';

type Token = { type: 'number' | 'identifier' | 'operator' | 'left' | 'right' | 'comma'; value: string };
type FormulaNode =
  | { kind: 'number'; value: number }
  | { kind: 'variable'; name: string }
  | { kind: 'unary'; operator: string; operand: FormulaNode }
  | { kind: 'binary'; operator: string; left: FormulaNode; right: FormulaNode }
  | { kind: 'call'; name: string; args: FormulaNode[] };

export type FormulaContext = Record<string, number | null | undefined>;

export type FormulaDefinition = {
  code: string;
  formula: string;
};

const FUNCTIONS: Record<string, (args: number[]) => number> = {
  MIN: (args) => Math.min(...args),
  MAX: (args) => Math.max(...args),
  ROUND: ([value, precision = 0]) => {
    const factor = 10 ** precision;
    return Math.round((value + Number.EPSILON) * factor) / factor;
  },
  FLOOR: ([value]) => Math.floor(value),
  CEIL: ([value]) => Math.ceil(value),
  ABS: ([value]) => Math.abs(value),
  COALESCE: (args) => args.find((value) => Number.isFinite(value)) ?? 0,
  IF: ([condition, whenTrue, whenFalse = 0]) => condition !== 0 ? whenTrue : whenFalse,
};

const CUSTOM_INPUT_PREFIX = 'INPUT_';

@Injectable()
export class FormulaEngineService {
  private tokens: Token[] = [];
  private position = 0;

  evaluate(formula: string, context: FormulaContext) {
    const ast = this.parse(formula);
    const variables = new Set<string>();
    const value = this.evaluateNode(ast, context, variables);

    if (!Number.isFinite(value)) {
      throw new BadRequestException('Formula produced a non-finite result.');
    }

    return {
      value,
      trace: {
        formula,
        variables: Object.fromEntries([...variables].map((key) => [key, context[key] ?? 0])),
        result: value,
      },
    };
  }

  getDependencies(formula: string) {
    const ast = this.parse(formula);
    const variables = new Set<string>();
    this.collectVariables(ast, variables);
    return [...variables];
  }

  orderDefinitions<T extends FormulaDefinition>(definitions: T[], externalVariables: string[] = []): T[] {
    const byCode = new Map(definitions.map((definition) => [definition.code.toUpperCase(), definition]));
    if (byCode.size !== definitions.length) {
      throw new BadRequestException('Salary component codes must be unique.');
    }

    const external = new Set(externalVariables.map((variable) => variable.toUpperCase()));
    const dependencies = new Map<string, string[]>();
    for (const definition of definitions) {
      const code = definition.code.toUpperCase();
      const refs = this.getDependencies(definition.formula).map((ref) => ref.toUpperCase());
      const unknown = refs.filter((ref) => !byCode.has(ref) && !external.has(ref) && !ref.startsWith(CUSTOM_INPUT_PREFIX));
      if (unknown.length) {
        throw new BadRequestException(`Formula ${definition.code} contains unknown variables: ${unknown.join(', ')}.`);
      }
      dependencies.set(code, refs.filter((ref) => byCode.has(ref)));
    }

    const visiting = new Set<string>();
    const visited = new Set<string>();
    const result: T[] = [];
    const visit = (code: string) => {
      if (visiting.has(code)) {
        throw new BadRequestException(`Circular salary component dependency detected at ${code}.`);
      }
      if (visited.has(code)) return;
      visiting.add(code);
      for (const dependency of dependencies.get(code) ?? []) visit(dependency);
      visiting.delete(code);
      visited.add(code);
      result.push(byCode.get(code)!);
    };
    for (const code of byCode.keys()) visit(code);
    return result;
  }

  private parse(formula: string) {
    if (!formula?.trim() || formula.length > 2000) {
      throw new BadRequestException('Formula must contain between 1 and 2000 characters.');
    }
    this.tokens = this.tokenize(formula);
    this.position = 0;
    const expression = this.parseComparison();
    if (this.position !== this.tokens.length) {
      throw new BadRequestException(`Unexpected token "${this.tokens[this.position].value}" in formula.`);
    }
    return expression;
  }

  private tokenize(formula: string) {
    const tokens: Token[] = [];
    let index = 0;
    while (index < formula.length) {
      const input = formula.slice(index);
      const whitespace = input.match(/^\s+/);
      if (whitespace) { index += whitespace[0].length; continue; }
      const number = input.match(/^(?:\d+(?:\.\d+)?|\.\d+)/);
      if (number) { tokens.push({ type: 'number', value: number[0] }); index += number[0].length; continue; }
      const identifier = input.match(/^[A-Za-z_][A-Za-z0-9_.]*/);
      if (identifier) { tokens.push({ type: 'identifier', value: identifier[0].toUpperCase() }); index += identifier[0].length; continue; }
      const two = input.slice(0, 2);
      if (['>=', '<=', '==', '!='].includes(two)) { tokens.push({ type: 'operator', value: two }); index += 2; continue; }
      const character = input[0];
      if ('+-*/%><'.includes(character)) tokens.push({ type: 'operator', value: character });
      else if (character === '(') tokens.push({ type: 'left', value: character });
      else if (character === ')') tokens.push({ type: 'right', value: character });
      else if (character === ',') tokens.push({ type: 'comma', value: character });
      else throw new BadRequestException(`Unsupported character "${character}" in formula.`);
      index += 1;
    }
    return tokens;
  }

  private parseComparison(): FormulaNode {
    let left = this.parseAdditive();
    while (this.peek('operator', ['>', '<', '>=', '<=', '==', '!='])) {
      const operator = this.consume().value;
      left = { kind: 'binary', operator, left, right: this.parseAdditive() };
    }
    return left;
  }

  private parseAdditive(): FormulaNode {
    let left = this.parseMultiplicative();
    while (this.peek('operator', ['+', '-'])) {
      const operator = this.consume().value;
      left = { kind: 'binary', operator, left, right: this.parseMultiplicative() };
    }
    return left;
  }

  private parseMultiplicative(): FormulaNode {
    let left = this.parseUnary();
    while (this.peek('operator', ['*', '/', '%'])) {
      const operator = this.consume().value;
      left = { kind: 'binary', operator, left, right: this.parseUnary() };
    }
    return left;
  }

  private parseUnary(): FormulaNode {
    if (this.peek('operator', ['+', '-'])) {
      return { kind: 'unary', operator: this.consume().value, operand: this.parseUnary() };
    }
    return this.parsePrimary();
  }

  private parsePrimary(): FormulaNode {
    const token = this.consume();
    if (!token) throw new BadRequestException('Formula ended unexpectedly.');
    if (token.type === 'number') return { kind: 'number', value: Number(token.value) };
    if (token.type === 'identifier') {
      if (!this.peek('left')) return { kind: 'variable', name: token.value };
      this.consume();
      const args: FormulaNode[] = [];
      if (!this.peek('right')) {
        args.push(this.parseComparison());
        while (this.peek('comma')) {
          this.consume();
          args.push(this.parseComparison());
        }
      }
      this.expect('right');
      if (!FUNCTIONS[token.value]) throw new BadRequestException(`Function ${token.value} is not allowed.`);
      return { kind: 'call', name: token.value, args };
    }
    if (token.type === 'left') {
      const value = this.parseComparison();
      this.expect('right');
      return value;
    }
    throw new BadRequestException(`Unexpected token "${token.value}" in formula.`);
  }

  private evaluateNode(node: FormulaNode, context: FormulaContext, variables: Set<string>): number {
    if (node.kind === 'number') return node.value;
    if (node.kind === 'variable') {
      variables.add(node.name);
      const value = context[node.name] ?? context[node.name.toLowerCase()] ?? 0;
      return Number(value);
    }
    if (node.kind === 'unary') {
      const value = this.evaluateNode(node.operand, context, variables);
      return node.operator === '-' ? -value : value;
    }
    if (node.kind === 'call') return FUNCTIONS[node.name](node.args.map((arg) => this.evaluateNode(arg, context, variables)));
    const left = this.evaluateNode(node.left, context, variables);
    const right = this.evaluateNode(node.right, context, variables);
    switch (node.operator) {
      case '+': return left + right;
      case '-': return left - right;
      case '*': return left * right;
      case '/': if (right === 0) throw new BadRequestException('Formula attempted division by zero.'); return left / right;
      case '%': if (right === 0) throw new BadRequestException('Formula attempted modulo by zero.'); return left % right;
      case '>': return left > right ? 1 : 0;
      case '<': return left < right ? 1 : 0;
      case '>=': return left >= right ? 1 : 0;
      case '<=': return left <= right ? 1 : 0;
      case '==': return left === right ? 1 : 0;
      case '!=': return left !== right ? 1 : 0;
      default: throw new BadRequestException(`Unsupported operator ${node.operator}.`);
    }
  }

  private collectVariables(node: FormulaNode, variables: Set<string>) {
    if (node.kind === 'variable') variables.add(node.name);
    else if (node.kind === 'unary') this.collectVariables(node.operand, variables);
    else if (node.kind === 'binary') { this.collectVariables(node.left, variables); this.collectVariables(node.right, variables); }
    else if (node.kind === 'call') node.args.forEach((arg) => this.collectVariables(arg, variables));
  }

  private peek(type: Token['type'], values?: string[]) {
    const token = this.tokens[this.position];
    return Boolean(token && token.type === type && (!values || values.includes(token.value)));
  }

  private consume() { return this.tokens[this.position++]; }

  private expect(type: Token['type']) {
    if (!this.peek(type)) throw new BadRequestException(`Expected ${type} in formula.`);
    return this.consume();
  }
}
