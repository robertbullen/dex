import { JsonSchemaTarget } from 'dex';
import * as path from 'path';
import * as tsj from 'typescript-json-schema';
import * as url from 'url';

export function generateJsonSchema(typeName: string, target: JsonSchemaTarget): tsj.Definition {
	// Resolve paths.
	const __filename: string = url.fileURLToPath(import.meta.url);
	const __dirname: string = path.dirname(__filename);

	const tsconfigFilePath: string = path.resolve(__dirname, '../tsconfig.json');
	const dataModelFilePath: string = path.resolve(__dirname, './typings/dex/index.d.ts');

	// Generate the JSON Schema from the type declarations file.
	const program: tsj.Program = tsj.programFromConfig(tsconfigFilePath, [dataModelFilePath]);

	const schema: tsj.Definition | null = tsj.generateSchema(program, typeName, {
		// Ensure that there's a named definition for PersonTargeted.
		aliasRef: true,

		// Limit the scope to just the type decelarations file.
		include: [dataModelFilePath],

		// Prohibit extra properties that aren't specified in the type declarations.
		noExtraProps: true,

		// Propagate which properties are required.
		required: true,

		// Create a definition for the root data type.
		topRef: true,
	});
	if (!schema) {
		throw new Error();
	}

	// Override the `PeopleDictionary` definition because TSJ doesn't generate usable schemas for
	// types like `Record<string, SomeType>`.
	const peopleDictionaryTypeName = `PeopleDictionary<\"${target}\">`;
	if (schema.definitions?.[peopleDictionaryTypeName]) {
		schema.definitions[peopleDictionaryTypeName] = {
			additionalProperties: {
				$ref: '#/definitions/Person',
			},
			type: 'object',
		};
	}

	return schema;
}
