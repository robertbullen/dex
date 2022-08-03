import angularExpressions from 'angular-expressions';
import { capitalCase } from 'capital-case';
import * as crypto from 'crypto';
import dayjs from 'dayjs';
import dayjsLocalizedFormat from 'dayjs/plugin/localizedFormat.js';
import Docxtemplater from 'docxtemplater';
import * as fs from 'fs/promises';
import Enumerable from 'linq';
import { orderBy, partition } from 'lodash-es';
import { lowerCase } from 'lower-case';
import * as path from 'path';
import PizZip from 'pizzip';
import { upperCase } from 'upper-case';

/**
 * @typedef {import('docxtemplater').DXT.Module} DxtModule
 * @typedef {import('docxtemplater').DXT.Parser} DxtParser
 * @typedef {import('docxtemplater').DXT.Part} DxtPart
 * @typedef {import('docxtemplater').DXT.SimplePart} DxtSimplePart
 */

Object.assign(angularExpressions.filters, {
	/**
	 * Transforms the given `value` to a string while changing the case according to `transform`.
	 *
	 * @param {{} | undefined | null} value
	 * @param {unknown} [transform]
	 */
	case(value, transform) {
		if (value === undefined || value === null) {
			return '';
		}

		switch (transform) {
			case 'capital':
				return capitalCase(value.toString());

			case 'lower':
				return lowerCase(value.toString());

			case 'upper':
				return upperCase(value.toString());

			default:
				return value.toString();
		}
	},

	/**
	 * Formats a given date `value` in the given `'dayjs'` format.
	 *
	 * @param {unknown} value
	 * @param {unknown} [format]
	 */
	date(value, format) {
		const isValidValue =
			value !== null &&
			value !== undefined &&
			(typeof value === 'number' ||
				typeof value === 'string' ||
				value instanceof Date ||
				dayjs.isDayjs(value));
		const newValue = isValidValue ? dayjs(value) : undefined;

		const isValidFormat = typeof format === 'string';
		const newFormat = isValidFormat ? format : undefined;

		return newValue?.format(newFormat) ?? value;
	},

	/**
	 * Limits the given `array` to `limit` number of items iff `array` is an `Array` and `limit` is
	 * coercable to a `number`.
	 *
	 * @param {unknown} array
	 * @param {unknown} limit
	 */
	limit(array, limit) {
		const limitNumber = Number(limit);
		return Array.isArray(array) && !Number.isNaN(limitNumber)
			? array.slice(0, limitNumber)
			: array;
	},

	/**
	 * Orders the given `array` by the given `properties` in the given `directions`.
	 *
	 * @param {unknown} array
	 * @param {string[]} [properties]
	 * @param {('asc' | 'desc')[]} [directions]
	 */
	orderBy(array, properties, directions) {
		if (!Array.isArray(array)) {
			return array;
		}

		// The incoming array must either be entirely 1-dimensional or 2-dimensional.
		const subarrayCount = array.reduce(
			(accumulator, item) => accumulator + Number(Array.isArray(item)),
			0,
		);
		if (subarrayCount > 0 && subarrayCount < array.length) {
			throw new Error('Inconsistent array dimensions');
		}

		// Simplify logic by always processing a 2-dimensional array.
		const arrays = subarrayCount > 0 ? array : [array];

		// Order each dimension individually and then concatenate them.
		return arrays.flatMap((subarray) => orderBy(subarray, properties, directions));
	},

	/**
	 * @param {unknown} array
	 * @param {string} condition
	 */
	partition(array, condition) {
		if (!Array.isArray(array)) {
			return array;
		}

		const testItem = angularExpressions.compile(condition.toString(), undefined);
		return partition(array, (item) => testItem(item));
	},

	/**
	 * Filters the given `array` to elements that satisfy the given `condition`.
	 *
	 * @param {unknown} array
	 * @param {{}} condition
	 */
	where(array, condition) {
		if (!Array.isArray(array)) {
			return array;
		}

		const testItem = angularExpressions.compile(condition.toString(), undefined);
		return array.filter((item) => testItem(item));
	},
});

dayjs.extend(dayjsLocalizedFormat);

/**
 * Parses and evaluates template expression using the Angular expressions engine.
 *
 * @implements {DxtParser}
 */
class AngularParser {
	/**
	 * @param {string} tag
	 * @returns {AngularParser}
	 */
	static create(tag) {
		return new AngularParser(tag);
	}

	/**
	 * @param {string} tag
	 */
	constructor(tag) {
		tag = tag.replace(/^\.$/, 'this').replace(/(’|‘)/g, "'").replace(/(“|”)/g, '"');
		this._evaluateExpression = angularExpressions.compile(tag, undefined);
	}

	/**
	 * @param {*} scope
	 * @param {import('docxtemplater').DXT.ParserContext} context
	 * @returns {unknown}
	 */
	get(scope, context) {
		let flattenedScope = {};
		for (let scopeIndex = 0; scopeIndex <= context.num; scopeIndex++) {
			Object.assign(flattenedScope, context.scopeList[scopeIndex]);
		}
		return this._evaluateExpression(scope, flattenedScope);
	}
}

/**
 * @implements {DxtModule}
 */
class TestModule {
	/**
	 * @param {unknown} options
	 */
	set(options) {
		console.log(this.set.name, { options });
	}

	/**
	 * @param {string} placeHoderContent
	 * @returns {DxtSimplePart | null}
	 */
	parse(placeHoderContent) {
		console.log(this.parse.name, { placeHoderContent });
		return null;
	}

	/**
	 * @param {DxtPart[]} postParsed
	 * @param {DxtModule[]} modules
	 * @param {unknown} options
	 * @returns {DxtPart[]}
	 */
	postparse(postParsed, modules, options) {
		console.log(this.postparse.name, { postParsed, modules, options });
		return postParsed;
	}
}

/**
 * @typedef {object} ReplacementImage
 * @property {string} oldImageMd5
 * @property {Buffer} newImageBuffer
 * @property {string} [oldImageExtension]
 */

/**
 * Subclasses `Docxtemplater` for a couple reasons:
 *
 * 1. Abstracts away the zip library details for clients.
 * 2. Adds support for replacing images.
 */
export class Templater extends Docxtemplater {
	/**
	 * @param {string} templatePptxFilePath
	 * @returns {Promise<Templater>}
	 */
	static async create(templatePptxFilePath) {
		// Load and unzip the PowerPoint template.
		const templatePptxBuffer = await fs.readFile(templatePptxFilePath);
		const templateZip = new PizZip(templatePptxBuffer);

		return new Templater(templateZip, {
			// modules: [new TestModule()],
			paragraphLoop: true,
			parser: AngularParser.create,
		});
	}

	/**
	 * @returns {PizZip}
	 */
	getZip() {
		return super.getZip();
	}

	/**
	 *
	 * @param {unknown} [data]
	 * @returns {this}
	 */
	render(data) {
		const extensions = {
			$util: {
				get now() {
					return dayjs();
				},
			},
		};

		return super.render(Object.assign({}, data, extensions));
	}

	/**
	 * Searches for the original image by the MD5 hash of its contents. This is necessary because
	 * PowerPoint often renames images in the media folder, making referring to them by name
	 * unreliable. If no image is found with the given MD5, then an exception is thrown.
	 *
	 * @param {ReplacementImage} replacementImage
	 * @returns {void}
	 */
	replaceImage(replacementImage) {
		// TODO: Cache MD5 hashes to improve performance.
		const imageKey = Enumerable.from(this.getZip().files)
			.where(
				(entry) =>
					entry.value.name.startsWith('ppt/media/') &&
					(!replacementImage.oldImageExtension ||
						entry.value.name.endsWith(replacementImage.oldImageExtension)),
			)
			.first((entry) => {
				const md5 = crypto
					.createHash('md5')
					.update(entry.value.asNodeBuffer())
					.digest('hex');
				return md5 === replacementImage.oldImageMd5;
			}).key;

		this.getZip().file(imageKey, replacementImage.newImageBuffer);
	}

	/**
	 * @param {ReplacementImage[]} replacementImages
	 */
	replaceImages(replacementImages) {
		replacementImages.forEach((replacementImage) => this.replaceImage(replacementImage));
	}

	/**
	 * @param {string} outputPptxFilePath
	 */
	async generateOutputFile(outputPptxFilePath) {
		await fs.mkdir(path.dirname(outputPptxFilePath), { recursive: true });
		const outputZipBuffer = this.getZip().generate({
			compression: 'DEFLATE',
			type: 'nodebuffer',
		});
		await fs.writeFile(outputPptxFilePath, outputZipBuffer);
	}
}
