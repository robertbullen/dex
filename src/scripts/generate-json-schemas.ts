#!/usr/bin/env ts-node

import { JsonSchemaTarget } from 'dex';
import * as fs from 'fs';
import * as path from 'path';
import stringify from 'safe-stable-stringify';
import * as url from 'url';
import { generateJsonSchema } from '../json-schema.js';

const __filename: string = url.fileURLToPath(import.meta.url);
const __dirname: string = path.dirname(__filename);

const schemaParams: [string, JsonSchemaTarget][] = [
	// ['DataModel', 'validator'],
	['DataModelEditor', 'editor'],
	['OrganizationEditor', 'editor'],
];

const dstDirPath: string = path.resolve(__dirname, '../schemas');
fs.mkdirSync(dstDirPath, { recursive: true });

for (const [typeName, target] of schemaParams) {
	const schema = generateJsonSchema(typeName, target);

	const schemaFilePath = path.join(dstDirPath, `${typeName}.json`);
	fs.writeFileSync(schemaFilePath, stringify(schema, undefined, '\t'));
}
