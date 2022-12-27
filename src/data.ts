import * as fs from 'fs/promises';
import * as path from 'path';
import RefParser from '@apidevtools/json-schema-ref-parser';

/**
 * Reads all the JSON/YAML and ES modules from the given `dataDirPath` and merges them into a
 * single object. This allows for data to be spread over multiple files and multiple file types.
 * JSON/YAML modules support JSON pointers/references, which makes for reuse of data possible.
 */
export async function loadDataFromFileSystem(fileOrDirPath: string): Promise<any> {
	type FileParser = (absFilePath: string) => Promise<any>;

	const fileParsers: Record<string, FileParser> = {
		json: (absFilePath: string): Promise<any> => RefParser.dereference(absFilePath),
		mjs: (absFilePath: string): Promise<any> =>
			import(absFilePath).then((module) => module.default),
		yaml: (absFilePath: string): Promise<any> => RefParser.dereference(absFilePath),
	};

	// Discover the data files to parse.
	const fileNameRegex = new RegExp(`\\.(${Object.keys(fileParsers).join('|')})$`, 'i');
	const absFileOrDirPath: string = path.resolve(fileOrDirPath);
	let absFilePaths: string[];
	if ((await fs.stat(absFileOrDirPath)).isDirectory()) {
		const relFilePaths: string[] = (await fs.readdir(absFileOrDirPath)).filter((relFilePath) =>
			fileNameRegex.test(relFilePath),
		);
		absFilePaths = relFilePaths.map((relFilePath: string): string =>
			path.join(absFileOrDirPath, relFilePath),
		);
	} else {
		absFilePaths = [absFileOrDirPath];
	}

	// Parse all data files into source objects.
	const sources = await Promise.all(
		absFilePaths.map((absFilePath) => {
			const extension: string = path.extname(absFilePath).substring(1);
			const parseFile: FileParser | undefined = fileParsers[extension];
			if (!parseFile) throw new Error(`Unsupported file extension '${extension}'`);
			return parseFile(absFilePath);
		}),
	);

	// Combine all source objects into a single data object.
	const data: any = Object.assign({}, ...sources);
	return data;
}
