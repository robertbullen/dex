import { orderBy } from 'lodash-es';
import * as yup from 'yup';
import { createFilter } from './create-filter.js';

type Direction = 'asc' | 'desc';

export const orderByFilter = createFilter(
	'orderBy',
	() =>
		yup
			.tuple([
				yup.array().required().ensure(),
				yup
					.array(
						yup
							.mixed<PropertyKey>({
								check: (value: unknown): value is PropertyKey =>
									typeof value === 'string' ||
									typeof value === 'number' ||
									value instanceof Symbol,
								type: 'PropertyKey',
							})
							.required(),
					)
					.optional()
					.ensure(),
				yup
					.array(
						yup
							.string<Direction>()
							.required()
							.oneOf(['asc', 'desc'] as const),
					)
					.optional()
					.ensure(),
			])
			.required(),
	(value: unknown[], properties?: PropertyKey[], directions?: Direction[]): unknown[] => {
		return orderBy(value, properties, directions);
	},
);
