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
	 * @param {unknown} value
	 * @param {'capital' | 'lower' | 'upper' | unknown} [transform]
	 */
	case(value, transform) {
		const isTransformValid =
			transform === 'capital' ||
			transform === 'lower' ||
			transform === 'upper' ||
			transform === undefined;
		if (!isTransformValid) {
			return value;
		}

		const valueString = String(value);

		switch (transform) {
			case 'capital':
				return capitalCase(valueString);

			case 'lower':
				return lowerCase(valueString);

			case 'upper':
				return upperCase(valueString);

			default:
				return valueString;
		}
	},

	/**
	 * Formats a given date `value` in the given `'dayjs'` format.
	 *
	 * @param {dayjs.ConfigType | unknown} value
	 * @param {string | unknown} [format]
	 */
	date(value, format) {
		const isValidValue =
			value !== null &&
			value !== undefined &&
			(typeof value === 'number' ||
				typeof value === 'string' ||
				value instanceof Date ||
				dayjs.isDayjs(value));
		const isValidFormat = typeof format === 'string';

		if (!(isValidValue && isValidFormat)) {
			return value;
		}

		const valueDayjs = dayjs(value);

		return valueDayjs.format(format);
	},

	/**
	 * Limits the given `array` to `limit` number of items iff `array` is an `Array` and `limit` is
	 * coercable to a `number`.
	 *
	 * @param {unknown[] | unknown} array
	 * @param {number | unknown} [limit = 10]
	 * @param {number | unknown} [offset = 0]
	 */
	limit(array, limit = 10, offset = 0) {
		const limitNumber = limit === undefined || limit === null ? 10 : Number(limit);
		const offsetNumber = offset === undefined || offset === null ? 0 : Number(offset);

		return Array.isArray(array) &&
			!Number.isNaN(limitNumber) &&
			limitNumber >= 0 &&
			!Number.isNaN(offsetNumber) &&
			offsetNumber >= 0
			? array.slice(offsetNumber, limitNumber)
			: array;
	},

	/**
	 * Orders the given `array` by the given `properties` in the given `directions`.
	 *
	 * @param {unknown[] | unknown} array
	 * @param {string[] | unknown} [properties]
	 * @param {('asc' | 'desc')[] | unknown} [directions]
	 */
	orderBy(array, properties, directions) {
		const isValidArray = Array.isArray(array);
		const isValidProperties =
			Array.isArray(properties) &&
			properties.every((property) => typeof property === 'string');
		const isValidDirections =
			Array.isArray(directions) &&
			directions.every((direction) => direction === 'asc' || direction === 'desc');

		if (!(isValidArray && isValidProperties && isValidDirections)) {
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
	 * @param {unknown[] | unknown} array
	 * @param {string | unknown} condition
	 */
	partition(array, condition) {
		const isValidArray = Array.isArray(array);
		const isValidCondition = typeof condition === 'string';

		if (!(isValidArray && isValidCondition)) {
			return array;
		}

		const testItem = angularExpressions.compile(condition, undefined);
		return partition(array, (item) => testItem(item));
	},

	/**
	 * Filters the given `array` to elements that satisfy the given `condition`.
	 *
	 * @param {unknown[] | unknown} array
	 * @param {string | unknown} condition
	 */
	where(array, condition) {
		const isValidArray = Array.isArray(array);
		const isValidCondition = typeof condition === 'string';

		if (!(isValidArray && isValidCondition)) {
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
