import * as yup from 'yup';

export function createFilter<
	TParams extends [unknown, ...unknown[]],
	TResult,
	TStaticProps extends object = {},
>(
	name: string,
	createParamsSchema: () => yup.TupleSchema<TParams>,
	filter: (...args: TParams) => TResult,
	staticProps?: TStaticProps,
): ((...args: unknown[]) => TResult) & TStaticProps {
	let paramsSchema: yup.Schema<TParams> | undefined;

	return Object.assign(
		{
			[name]: (...args: unknown[]) => {
				// Validate the arguments.
				paramsSchema ??= createParamsSchema();

				// `yup.TupleSchema.validateSync()` takes over the strict or coercive handling of
				// arguments rather than allow each member schema to operate under its own
				// preference. So a hand-rolled validation projection is used as a workaround.
				// const validArgs = paramsSchema.validateSync(args);

				// @ts-ignore
				const schemas: yup.Schema[] = paramsSchema.spec.types;
				const validArgs = schemas.map((schema: yup.Schema, index: number): unknown =>
					schema.validateSync(args[index]),
				) as TParams;

				// Invoke the filter.
				return filter(...validArgs);
			},
		}[name],
		staticProps,
	);
}
