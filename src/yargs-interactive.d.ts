import {
	Arguments,
	Argv,
	CamelCaseKey,
	InferredOptionType,
	Options as YargsSingleOption,
} from 'yargs';
import { OptionData } from 'yargs-interactive';

/** The type of an option object in 'yargs-interactive'. */
type InteractiveSingleOption = OptionData | { default: boolean };

/** The type of an option object from either 'yargs' or 'yargs-interactive' */
type TypedSingleOption = YargsSingleOption | InteractiveSingleOption;

/** A mapping of options. */
type TypedOptions = Record<string, TypedSingleOption>;

/** For options that prompt the user, ensure that they are non-nullable. */
// TODO: This currently assumes that all prompted options will be strings!
// prettier-ignore
type InferredOptionTypes2<T extends TypedOptions> = {
	[K in keyof T]:
		T[K] extends { prompt: 'always' | 'if-no-arg' | 'if-empty' } ? string :
		T[K] extends { prompt: 'never' | undefined } ? (string | undefined) :
		InferredOptionType<T[K]>;
};

declare module 'yargs-interactive' {
	// Correct the declaration of the default export to accept two arguments and return an
	// interface with better type support.
	export default function yargsInteractive(
		processArgs?: string[],
		cwd?: string,
	): TypedInteractive;

	// Add proper type arguments to `Interactive`.
	export interface TypedInteractive<T = {}> extends Argv<T> {
		help(): this;
		usage(usage: string): this;

		interactive<O extends TypedOptions>(
			options: O,
		): TypedInteractive<Omit<T, keyof O> & InferredOptionTypes2<O>>;

		then(
			callback: (result: {
				[key in keyof Arguments<T> as key | CamelCaseKey<key>]: Arguments<T>[key];
			}) => any,
		): this;
	}
}
