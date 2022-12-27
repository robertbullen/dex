import { describe, expect, test } from '@jest/globals';
import * as yup from 'yup';
import * as helpers from './helpers.js';
import { limitFilter } from './limit-filter.js';

describe(limitFilter, () => {
	describe('when arguments are invalid', () => {
		test.each<[unknown, unknown, unknown]>([
			// There's no such thing as an invalid first argument, any non-array will be wrapped
			// in an array.

			// Invalid second argument.
			// [helpers.arrays.ofNumbers, undefined, undefined],
			// [helpers.arrays.ofNumbers, null, undefined],

			[helpers.arrays.ofNumbers, false, undefined],
			[helpers.arrays.ofNumbers, true, undefined],

			// [helpers.arrays.ofNumbers, Number.NaN, undefined],
			// [helpers.arrays.ofNumbers, 0, undefined],
			[helpers.arrays.ofNumbers, -1, undefined],

			[helpers.arrays.ofNumbers, helpers.strings.empty, undefined],
			[helpers.arrays.ofNumbers, helpers.strings.nonempty, undefined],

			[helpers.arrays.ofNumbers, helpers.objects.empty, undefined],
			[helpers.arrays.ofNumbers, helpers.objects.nonempty, undefined],
			[helpers.arrays.ofNumbers, helpers.objects.toStringable(), undefined],

			[helpers.arrays.ofNumbers, helpers.arrays.empty, undefined],
			[helpers.arrays.ofNumbers, helpers.arrays.ofKeyedObjects, undefined],

			// Invalid third argument.
			// [helpers.arrays.ofNumbers, undefined, undefined],
			// [helpers.arrays.ofNumbers, undefined, null],

			[helpers.arrays.ofNumbers, undefined, false],
			[helpers.arrays.ofNumbers, undefined, true],

			// [helpers.arrays.ofNumbers, undefined, Number.NaN],
			// [helpers.arrays.ofNumbers, undefined, 0],
			[helpers.arrays.ofNumbers, undefined, -1],

			[helpers.arrays.ofNumbers, undefined, helpers.strings.empty],
			[helpers.arrays.ofNumbers, undefined, helpers.strings.nonempty],

			[helpers.arrays.ofNumbers, undefined, helpers.objects.empty],
			[helpers.arrays.ofNumbers, undefined, helpers.objects.nonempty],
			[helpers.arrays.ofNumbers, undefined, helpers.objects.toStringable()],

			[helpers.arrays.ofNumbers, undefined, helpers.arrays.empty],
			[helpers.arrays.ofNumbers, undefined, helpers.arrays.ofKeyedObjects],
		])(
			`value: %p, limit: %p, offset: %p => ${yup.ValidationError.name}`,
			(value, limit, offset) => {
				expect(() => limitFilter(value, limit, offset)).toThrow(yup.ValidationError);
			},
		);
	});

	describe('when arguments are valid', () => {
		test.each<[unknown, unknown, unknown, unknown[]]>([
			[undefined, undefined, undefined, [undefined]],
			[helpers.strings.nonempty, undefined, undefined, [helpers.strings.nonempty]],

			[
				helpers.arrays.ofNumbers,
				undefined,
				undefined,
				helpers.arrays.ofNumbers.slice(
					limitFilter.OFFSET_DEFAULT,
					limitFilter.LIMIT_DEFAULT,
				),
			],
			[
				helpers.arrays.ofNumbers,
				null,
				null,
				helpers.arrays.ofNumbers.slice(
					limitFilter.OFFSET_DEFAULT,
					limitFilter.LIMIT_DEFAULT,
				),
			],

			[
				helpers.arrays.ofNumbers,
				limitFilter.LIMIT_DEFAULT,
				limitFilter.LIMIT_DEFAULT,
				helpers.arrays.ofNumbers.slice(
					limitFilter.LIMIT_DEFAULT,
					limitFilter.LIMIT_DEFAULT * 2,
				),
			],
			[
				helpers.arrays.ofNumbers,
				limitFilter.LIMIT_DEFAULT.toString(),
				limitFilter.LIMIT_DEFAULT.toString(),
				helpers.arrays.ofNumbers.slice(
					limitFilter.LIMIT_DEFAULT,
					limitFilter.LIMIT_DEFAULT * 2,
				),
			],
		])('value: %p, limit: %p, offset: %p => %p', (value, limit, offset, expected) => {
			const actual = limitFilter(value, limit, offset);
			expect(actual).toEqual(expected);
		});
	});
});
