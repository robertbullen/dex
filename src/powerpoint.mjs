import { Templater } from './templater.mjs';
import * as util from 'util';

util.inspect.defaultOptions.depth = Infinity;

/**
 * Does what it says on the tin! This is a convenience function for the various steps required to
 * use a {@link Templater}.
 *
 * @param {string} templatePptxFilePath
 * @param {DataModelType} data
 * @param {import('./templater.mjs').ReplacementImage[]} replacementImages A map of image file names (as they are embedded in the
 * PPTX) to the content to replace them with. At this time, replacements should be of the same
 * dimensions and format as the original.
 * @param {string} outputPptxFilePath
 * @returns {Promise<void>}
 */
export async function generatePowerpoint(
	templatePptxFilePath,
	data,
	replacementImages,
	outputPptxFilePath,
) {
	const templater = await Templater.create(templatePptxFilePath);

	templater.render(data);
	templater.replaceImages(replacementImages);

	await templater.generateOutputFile(outputPptxFilePath);
}
