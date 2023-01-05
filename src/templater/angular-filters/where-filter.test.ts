import { describe, expect, test } from '@jest/globals';
import * as yup from 'yup';
import * as helpers from './helpers.js';
import { whereFilter } from './where-filter.js';

describe(whereFilter, () => {
	describe('when arguments are invalid', () => {
		test.each<[unknown, unknown]>([
			// There's no such thing as an invalid first argument, any non-array will be wrapped
			// in an array.

			// Invalid second argument.
			[helpers.arrays.ofKeyedObjects, undefined],
			[helpers.arrays.ofKeyedObjects, null],

			[helpers.arrays.ofKeyedObjects, false],
			[helpers.arrays.ofKeyedObjects, true],

			[helpers.arrays.ofKeyedObjects, Number.NaN],
			[helpers.arrays.ofKeyedObjects, 0],
			[helpers.arrays.ofKeyedObjects, 1],

			[helpers.arrays.ofKeyedObjects, helpers.objects.empty],
			[helpers.arrays.ofKeyedObjects, helpers.objects.nonempty],
			[helpers.arrays.ofKeyedObjects, helpers.objects.toStringable()],

			[helpers.arrays.ofKeyedObjects, helpers.arrays.empty],
			[helpers.arrays.ofKeyedObjects, helpers.arrays.ofStrings],

			[helpers.arrays.ofKeyedObjects, helpers.symbols.symbol],
		])(`value: %p, condition: %p => ${yup.ValidationError.name}`, (value, condition) => {
			expect(() => whereFilter(value, condition)).toThrow(yup.ValidationError);
		});
	});

	describe('when arguments are valid', () => {
		test.each<[unknown | unknown[], string, unknown[]]>([
			// Scalars.
			[false, 'this', []],
			[true, 'this', [true]],
			[false, '!this', [false]],
			[true, '!this', []],

			[helpers.strings.nonempty, 'true', [helpers.strings.nonempty]],
			[helpers.strings.nonempty, 'false', []],

			[
				helpers.strings.nonempty,
				`this === '${helpers.strings.nonempty}'`,
				[helpers.strings.nonempty],
			],

			// Arrays of scalars.
			[
				helpers.arrays.ofNumbers,
				'this % 2 === 0',
				helpers.arrays.ofNumbers.filter((x) => x % 2 === 0),
			],

			// Arrays of objects.
			[helpers.arrays.ofKeyedObjects, `true`, helpers.arrays.ofKeyedObjects],
			[
				helpers.arrays.ofKeyedObjects,
				`key1 === ${helpers.arrays.ofKeyedObjects[0]?.key1}`,
				[helpers.arrays.ofKeyedObjects[0]],
			],
			[
				helpers.arrays.ofKeyedObjects,
				'key1 % 2 === 0',
				helpers.arrays.ofKeyedObjects.filter((o) => o.key1 % 2 == 0),
			],
		])('value: %p, condition: %p => %p', (value, condition, expected) => {
			const actual = whereFilter(value, condition);
			expect(actual).toEqual(expected);
		});
	});
});
