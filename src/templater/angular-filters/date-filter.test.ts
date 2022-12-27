import { describe, expect, test } from '@jest/globals';
import dayjs from 'dayjs';
import * as yup from 'yup';
import { dateFilter } from './date-filter.js';

describe(dateFilter, () => {
	const validString = '1976-06-12T03:55:00-05:00';
	const validDate = new Date(validString);
	const validNumber = validDate.getTime();
	const validDayJs = dayjs(validString);
	const validFormat = 'LLL';
	const expectedFormattedText = validDayJs.format(validFormat);

	describe('when arguments are invalid', () => {
		test.each<[unknown, unknown]>([
			// Invalid first argument.
			[undefined, validFormat],
			[null, validFormat],

			[false, validFormat],
			[true, validFormat],

			// [0, validFormat], valid
			// [1, validFormat], valid
			[Number.NaN, validFormat],

			['', validFormat],
			['foo', validFormat],

			[{}, validFormat],
			[{ toString: () => 'foo' }, validFormat],

			[[], validFormat],
			[['foo', 'bar'], validFormat],

			[Date.parse('abc'), validFormat],
			[dayjs('abc'), validFormat],

			// Invalid second argument.
			[validDayJs, false],
			[validDayJs, true],

			[validDayJs, 0],
			[validDayJs, 1],
			[validDayJs, Number.NaN],

			[validDayJs, {}],
			[validDayJs, { toString: () => 'foo' }],

			[validDayJs, []],
			[validDayJs, ['foo', 'bar']],
		])(`value: %p, format: %p => ${yup.ValidationError.name}`, (value, format) => {
			expect(() => dateFilter(value, format)).toThrow(yup.ValidationError);
		});
	});

	describe('when arguments are valid', () => {
		test.each<[unknown, string | undefined | null, string]>([
			[validNumber, undefined, validString],
			[validNumber, null, validString],

			[validString, undefined, validString],
			[validString, null, validString],

			[validDayJs, undefined, validString],
			[validDayJs, null, validString],
		])('value: %p, format: %p => %p', (value, transform, expected) => {
			const actual = dateFilter(value, transform);
			expect(actual).toEqual(expected);
		});
	});
});
