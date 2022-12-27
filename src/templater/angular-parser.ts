import angularExpressions, { EvaluatorFunc } from 'angular-expressions';
import { DXT } from 'docxtemplater';
import { customFilters } from './angular-filters/index.js';

/**
 * Parses and evaluates template expression using the Angular expressions engine.
 */
export class AngularParser implements DXT.Parser {
	/**
	 * A factory method that can be passed as a function.
	 */
	public static create(tag: string): AngularParser {
		return new AngularParser(tag);
	}

	public constructor(tag: string) {
		tag = tag.replace(/^\.$/, 'this').replace(/(’|‘)/g, "'").replace(/(“|”)/g, '"');
		this._evaluateExpression = angularExpressions.compile(tag, undefined);
	}

	public get(scope: unknown, context: DXT.ParserContext): unknown {
		let flattenedScope = {};
		for (let scopeIndex = 0; scopeIndex <= context.num; scopeIndex++) {
			Object.assign(flattenedScope, context.scopeList[scopeIndex]);
		}
		return this._evaluateExpression(scope, flattenedScope);
	}

	private static readonly _ctor: void = (() => {
		Object.assign(angularExpressions.filters, customFilters);
	})();

	private readonly _evaluateExpression: EvaluatorFunc;
}
