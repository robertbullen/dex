import { compile, EvaluatorFunc } from 'angular-expressions';
import * as yup from 'yup';
import { createFilter } from './create-filter.js';

export const whereFilter = createFilter(
	'where',
	() => yup.tuple([yup.array().required().ensure(), yup.string().required().strict()]).required(),
	(value: unknown[], condition: string): unknown[] => {
		const testItem: EvaluatorFunc = compile(condition.toString());
		return value.filter((item: unknown): boolean => !!testItem(item));
	},
);
