// Corner cases to consider:
//
// - undefined
// - null
//
// - false
// - true
//
// - Number.NaN
// - 0
// - 1
//
// - empty string
// - nonempty string
//
// - empty object
// - nonempty object
// - toStringable object
//
// - empty array
// - nonempty array
//
// - symbol

export const strings = {
	empty: '',

	nonempty: 'foo',
};

export const objects = {
	empty: {},

	nonempty: { key: strings.nonempty },

	toStringable(result?: string) {
		return { toString: (): string => result ?? objects.nonempty.key };
	},

	nonexistentKey: '!key',
};

export const arrays = {
	empty: [],

	ofNumbers: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],

	ofStrings: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'],

	ofKeyedObjects: [
		{ key1: 0, key2: 'z' },
		{ key1: 1, key2: 'y' },
		{ key1: 2, key2: 'x' },
		{ key1: 3, key2: 'w' },
		{ key1: 4, key2: 'v' },
		{ key1: 5, key2: 'u' },
		{ key1: 6, key2: 't' },
		{ key1: 7, key2: 's' },
		{ key1: 8, key2: 'r' },
		{ key1: 9, key2: 'q' },
	],
};

export const symbols = {
	symbol: Symbol(strings.nonempty),
};
