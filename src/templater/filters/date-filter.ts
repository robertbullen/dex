import dayjs from 'dayjs';
import dayjsLocalizedFormat from 'dayjs/plugin/localizedFormat.js';
import * as yup from 'yup';
import { createFilter } from './create-filter.js';

dayjs.extend(dayjsLocalizedFormat);

export const dateFilter = createFilter(
	'dateFilter',
	() =>
		yup
			.tuple([
				yup
					.mixed<dayjs.Dayjs>({
						check: dayjs.isDayjs,
						type: 'dayjs.Dayjs',
					})
					.required()
					.transform(
						(
							value: any,
							_originalValue: any,
							schema: yup.MixedSchema<dayjs.Dayjs>,
						): any =>
							// Dayjs accepts `string | number | Date | Dayjs | null | undefined`
							// (see dayjs.ConfigType). This code removes `null` and `undefined`
							// as candidate types.
							!schema.isType(value) &&
							value !== null &&
							value !== undefined &&
							(typeof value === 'number' ||
								typeof value === 'string' ||
								value instanceof Date)
								? dayjs(value)
								: value,
					)
					.test((value: dayjs.Dayjs): boolean => value.isValid()),
				// Yup is not enforcing
				yup.string().optional().nullable().strict(),
			])
			.required(),
	(value: dayjs.Dayjs, format?: string | null): string => {
		return value.format(format ?? undefined);
	},
);
