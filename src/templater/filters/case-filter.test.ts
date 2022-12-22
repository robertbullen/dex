import { describe, expect, test } from '@jest/globals';
import * as yup from 'yup';
import { caseFilter, CaseTransform } from './case-filter.js';

describe(caseFilter, () => {
	describe('when arguments are invalid', () => {
		test.each<[unknown, unknown]>([
			// Invalid first argument.
			[{}, undefined],
			[{}, null],
			[{}, 'capital'],

			[[], undefined],
			[[], null],
			[[], 'capital'],

			// Invalid second argument.
			['HELLO, world!', false],
			['HELLO, world!', true],

			['HELLO, world!', 0],
			['HELLO, world!', 1],
			['HELLO, world!', Number.NaN],

			['HELLO, world!', ''],
			['HELLO, world!', 'foo'],

			['HELLO, world!', {}],
			['HELLO, world!', { toString: () => 'foo' }],

			['HELLO, world!', []],
			['HELLO, world!', ['foo', 'bar']],
		])(`value: %p, transform: %p => ${yup.ValidationError.name}`, (value, transform) => {
			expect(() => caseFilter(value, transform)).toThrow(yup.ValidationError);
		});
	});

	describe('when arguments are valid', () => {
		test.each<[unknown, CaseTransform | undefined | null, string]>([
			[undefined, undefined, ''],
			[null, null, ''],
			['HELLO, world!', undefined, 'HELLO, world!'],
			['HELLO, world!', null, 'HELLO, world!'],
			['HELLO, world!', 'capital', 'Hello, World!'],
			['HELLO, world!', 'lower', 'hello, world!'],
			['HELLO, world!', 'upper', 'HELLO, WORLD!'],
			[false, 'lower', 'false'],
			[true, 'upper', 'TRUE'],
			[0, undefined, '0'],
			[1, 'capital', '1'],
			[Number.NaN, 'lower', 'nan'],
			[{ toString: () => 'HELLO, world!' }, undefined, 'HELLO, world!'],
			[Symbol('HELLO, world!'), undefined, 'Symbol(HELLO, world!)'],
		])('value: %p, transform: %p => %p', (value, transform, expected) => {
			const actual = caseFilter(value, transform);
			expect(actual).toEqual(expected);
		});
	});
});
