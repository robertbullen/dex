import { caseFilter } from './case-filter.js';
import { dateFilter } from './date-filter.js';
import { limitFilter } from './limit-filter.js';
import { orderByFilter } from './order-by-filter.js';
import { whereFilter } from './where-filter.js';

export default {
	case: caseFilter,
	date: dateFilter,
	limit: limitFilter,
	orderBy: orderByFilter,
	where: whereFilter,
};
