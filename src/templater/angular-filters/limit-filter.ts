import * as yup from 'yup';
import { createFilter } from './create-filter.js';

export const limitFilter = createFilter(
	'limit',
	() =>
		yup
			.tuple([
				yup.array().required().ensure(),
				yup.number().optional().nullable().integer().min(0),
				yup.number().optional().nullable().integer().min(0),
			])
			.required(),
	(
		value: unknown[],
		limit: number | null | undefined,
		offset: number | null | undefined,
	): unknown[] => {
		limit ??= limitFilter.LIMIT_DEFAULT;
		offset ??= limitFilter.OFFSET_DEFAULT;
		return value.slice(offset, offset + limit);
	},
	{
		LIMIT_DEFAULT: 5,
		OFFSET_DEFAULT: 0,
	},
);
