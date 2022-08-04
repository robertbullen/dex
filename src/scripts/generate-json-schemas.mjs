#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import stringify from 'safe-stable-stringify';
import * as url from 'url';
import { generateJsonSchema } from '../json-schema.mjs';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {[string, JsonSchemaTarget][]} */
const schemaParams = [
	// ['DataModel', 'validator'],
	['DataModelEditor', 'editor'],
	['OrganizationEditor', 'editor'],
];

const dstDirPath = path.resolve(__dirname, '../schemas');
fs.mkdirSync(dstDirPath, { recursive: true });

for (const [typeName, target] of schemaParams) {
	const schema = generateJsonSchema(typeName, target);

	const schemaFilePath = path.join(dstDirPath, `${typeName}.json`);
	fs.writeFileSync(schemaFilePath, stringify(schema, undefined, '\t'));
}
