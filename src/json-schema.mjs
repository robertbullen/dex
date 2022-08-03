import * as tsj from 'typescript-json-schema';
import * as path from 'path';
import * as url from 'url';

/**
 * @param {string} typeName
 * @param {JsonSchemaTarget} target
 * @returns {tsj.Definition}
 */
export function generateJsonSchema(typeName, target) {
	// Resolve paths.
	const __filename = url.fileURLToPath(import.meta.url);
	const __dirname = path.dirname(__filename);

	const jsconfigFilePath = path.resolve(__dirname, '../jsconfig.json');
	const dataModelFilePath = path.resolve(__dirname, 'data-model.d.ts');

	// Generate the JSON Schema from the type declarations file.
	const program = tsj.programFromConfig(jsconfigFilePath, [dataModelFilePath]);

	const schema = tsj.generateSchema(program, typeName, {
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
