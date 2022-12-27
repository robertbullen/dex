import { filters } from 'angular-expressions';
import { caseFilter } from './case-filter.js';
import { dateFilter } from './date-filter.js';
import { limitFilter } from './limit-filter.js';
import { orderByFilter } from './order-by-filter.js';
import { whereFilter } from './where-filter.js';

export const customFilters = {
	case: caseFilter,
	date: dateFilter,
	limit: limitFilter,
	orderBy: orderByFilter,
	where: whereFilter,
} satisfies typeof filters;
