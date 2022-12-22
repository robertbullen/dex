import { capitalCase } from 'capital-case';
import { lowerCase } from 'lower-case';
import { upperCase } from 'upper-case';
import * as yup from 'yup';
import { createFilter } from './create-filter.js';

export const CaseTransform = {
	capital: 'capital',
	lower: 'lower',
	upper: 'upper',
} as const;
export type CaseTransform = typeof CaseTransform[keyof typeof CaseTransform];

export const caseFilter = createFilter(
	'caseFilter',
	() =>
		yup
			.tuple([
				yup.string().ensure(),
				yup
					.string<CaseTransform>()
					.optional()
					.nullable()
					.oneOf([...Object.values(CaseTransform), null]),
			])
			.required(),
	(value: string, transform: CaseTransform | null | undefined): string => {
		switch (transform) {
			case 'capital':
				return capitalCase(value, { stripRegexp: / / });

			case 'lower':
				return lowerCase(value);

			case 'upper':
				return upperCase(value);

			default:
				return value;
		}
	},
);
