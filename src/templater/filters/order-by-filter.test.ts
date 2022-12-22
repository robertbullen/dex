import { describe, expect, test } from '@jest/globals';
import { shuffle } from 'lodash-es';
import * as yup from 'yup';
import * as helpers from './helpers.js';
import { orderByFilter } from './order-by-filter.js';

describe(orderByFilter, () => {
	describe('when arguments are invalid', () => {
		test.each<[unknown, unknown, unknown]>([
			// There's no such thing as an invalid first argument, any non-array will be wrapped
			// in an array.

			// Invalid second argument.
			// [validArray, undefined, undefined],
			// [validArray, null, undefined],

			[helpers.arrays.ofKeyedObjects, false, undefined],
			[helpers.arrays.ofKeyedObjects, true, undefined],

			// Invalid third argument.
			[helpers.arrays.ofKeyedObjects, undefined, '!asc'],
			[helpers.arrays.ofKeyedObjects, undefined, '!desc'],
			[helpers.arrays.ofKeyedObjects, undefined, ['!asc']],
			[helpers.arrays.ofKeyedObjects, undefined, ['!desc']],
			[helpers.arrays.ofKeyedObjects, undefined, [undefined]],
			[helpers.arrays.ofKeyedObjects, undefined, [undefined]],
		])(
			`value: %p, properties: %p, directions: %p => ${yup.ValidationError.name}`,
			(value, properties, directions) => {
				expect(() => orderByFilter(value, properties, directions)).toThrow(
					yup.ValidationError,
				);
			},
		);
	});

	describe('when arguments are valid', () => {
		const shuffledNumbers = shuffle(helpers.arrays.ofNumbers);
		const sortedNumbers = shuffledNumbers.slice().sort();

		const shuffledStrings = shuffle(helpers.arrays.ofStrings);
		const sortedStrings = shuffledStrings.slice().sort();

		const shuffledObjects = shuffle(helpers.arrays.ofKeyedObjects);

		test.each<[unknown, unknown, unknown, unknown[]]>([
			// Non-arrays should be wrapped in arrays.
			[helpers.strings.nonempty, undefined, undefined, [helpers.strings.nonempty]],
			[helpers.objects.nonempty, undefined, undefined, [helpers.objects.nonempty]],

			// Arrays of sortable items should sort ascending without any keys or directions specified.
			[shuffledNumbers, undefined, undefined, sortedNumbers],
			[shuffledNumbers, null, null, sortedNumbers],
			[shuffledNumbers, [], [], sortedNumbers],

			[shuffledStrings, undefined, undefined, sortedStrings],
			[shuffledStrings, null, null, sortedStrings],
			[shuffledStrings, [], [], sortedStrings],

			[shuffledObjects, undefined, undefined, shuffledObjects],
			[shuffledObjects, null, null, shuffledObjects],
			[shuffledObjects, [], [], shuffledObjects],

			// Nonexistent keys should be ignored and no sorting should occur.
			[
				helpers.arrays.ofKeyedObjects,
				helpers.objects.nonexistentKey,
				undefined,
				helpers.arrays.ofKeyedObjects,
			],
			[
				helpers.arrays.ofKeyedObjects,
				[helpers.objects.nonexistentKey],
				undefined,
				helpers.arrays.ofKeyedObjects,
			],

			// Valid keys and orders should be obeyed.
			[
				shuffledObjects,
				'key1',
				'asc',
				shuffledObjects.slice().sort((a, b) => a.key1 - b.key1),
			],
			[
				shuffledObjects,
				['key1'],
				['asc'],
				shuffledObjects.slice().sort((a, b) => a.key1 - b.key1),
			],
			[
				shuffledObjects,
				['key1'],
				['desc'],
				shuffledObjects.slice().sort((a, b) => b.key1 - a.key1),
			],

			[
				shuffledObjects,
				'key2',
				'asc',
				shuffledObjects.slice().sort((a, b) => a.key2.localeCompare(b.key2)),
			],
			[
				shuffledObjects,
				['key2'],
				['asc'],
				shuffledObjects.slice().sort((a, b) => a.key2.localeCompare(b.key2)),
			],
			[
				shuffledObjects,
				['key2'],
				['desc'],
				shuffledObjects.slice().sort((a, b) => b.key2.localeCompare(a.key2)),
			],

			[
				shuffledObjects,
				['key1', 'key2'],
				['asc', 'desc'],
				shuffledObjects
					.slice()
					.sort((a, b) => a.key1 - b.key1 || b.key2.localeCompare(a.key2)),
			],
			[
				shuffledObjects,
				['key2', 'key1'],
				['asc', 'desc'],
				shuffledObjects
					.slice()
					.sort((a, b) => a.key2.localeCompare(b.key2) || b.key1 - a.key1),
			],
		])('value: %p, limit: %p, offset: %p => %p', (value, limit, offset, expected) => {
			const actual = orderByFilter(value, limit, offset);
			expect(actual).toEqual(expected);
		});
	});
});
