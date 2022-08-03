import * as fs from 'fs/promises';
import * as path from 'path';
import RefParser from '@apidevtools/json-schema-ref-parser';

/**
 * Reads all the JSON/YAML and ES modules from the given `dataDirPath` and merges them into a
 * single object. This allows for data to be spread over multiple files and multiple file types.
 * JSON/YAML modules support JSON pointers/references, which makes for reuse of data possible.
 *
 * @param {string} fileOrDirPath
 * @returns {Promise<any>}
 */
export async function loadDataFromFileSystem(fileOrDirPath) {
	/** @type {Record<string, (absFilePath: string) => Promise<any>>} */
	const fileParsers = {
		json: (absFilePath) => RefParser.dereference(absFilePath),
		mjs: (absFilePath) => import(absFilePath).then((module) => module.default),
		yaml: (absFilePath) => RefParser.dereference(absFilePath),
	};

	// Discover the data files to parse.
	const fileNameRegex = new RegExp(`\\.(${Object.keys(fileParsers).join('|')})$`, 'i');
	const absFileOrDirPath = path.resolve(fileOrDirPath);
	let absFilePaths;
	if ((await fs.stat(absFileOrDirPath)).isDirectory()) {
		const relFilePaths = (await fs.readdir(absFileOrDirPath)).filter((relFilePath) =>
			fileNameRegex.test(relFilePath),
		);
		absFilePaths = relFilePaths.map((relFilePath) => path.join(absFileOrDirPath, relFilePath));
	} else {
		absFilePaths = [absFileOrDirPath];
	}

	// Parse all data files into source objects.
	const sources = await Promise.all(
		absFilePaths.map((absFilePath) => {
			const extension = path.extname(absFilePath).substring(1);
			const parseFile = fileParsers[extension];
			return parseFile(absFilePath);
		}),
	);

	// Combine all source object into a single data.
	const data = Object.assign({}, ...sources);
	return data;
}
