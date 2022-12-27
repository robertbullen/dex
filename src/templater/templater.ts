import * as crypto from 'crypto';
import dayjs from 'dayjs';
import { DataModel } from 'dex';
import Docxtemplater, { DXT } from 'docxtemplater';
import * as fs from 'fs/promises';
import Enumerable from 'linq';
import * as path from 'path';
import PizZip from 'pizzip';
import { AngularParser } from './angular-parser.js';

export interface ReplacementImage {
	newImageBuffer: Buffer;
	oldImageExtension?: string;
	oldImageMd5: string;
}

/**
 * Subclasses `Docxtemplater` for a couple reasons:
 *
 * 1. Abstracts away the zip library details for clients.
 * 2. Adds support for replacing images.
 *
 * This implementation currently assumes it will be operating on PowerPoint documents.
 */
export class Templater extends Docxtemplater {
	public static async create(templatePptxFilePath: string): Promise<Templater> {
		// Load and unzip the template.
		const templateBuffer: Buffer = await fs.readFile(templatePptxFilePath);
		const templateZip = new PizZip(templateBuffer);

		return new Templater(templateZip, {
			paragraphLoop: true,
			parser: AngularParser.create,
		});
	}

	private constructor(templateZip: PizZip, options: DXT.ConstructorOptions) {
		super(templateZip, options);
	}

	/**
	 * This is a convenience method for the various steps required to use a {@link Templater}.
	 */
	public static async execute(
		templatePptxFilePath: string,
		data: DataModel,
		replacementImages: ReplacementImage[],
		outputPptxFilePath: string,
	): Promise<void> {
		const templater = await Templater.create(templatePptxFilePath);

		templater.render(data);
		templater.replaceImages(replacementImages);

		await templater.generateOutputFile(outputPptxFilePath);
	}

	/**
	 * Overrides the base implementation to add a stronger return type.
	 */
	public getZip(): PizZip {
		return super.getZip();
	}

	/**
	 * Overrides the base implementation to add some utilities available in the template.
	 */
	public render(data: unknown): this {
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
	 * images may be renamed in the media folder as the collection of embedded images changes,
	 * making referring to them by name unreliable. If no image is found with the given MD5, then
	 * an exception is thrown.
	 */
	public replaceImage(replacementImage: ReplacementImage): void {
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

	public replaceImages(replacementImages: ReplacementImage[]): void {
		replacementImages.forEach((replacementImage) => this.replaceImage(replacementImage));
	}

	/**
	 * Writes a PowerPoint document to disk. {@link render} should be invoked beforehand.
	 */
	public async generateOutputFile(outputPptxFilePath: string): Promise<void> {
		await fs.mkdir(path.dirname(outputPptxFilePath), { recursive: true });
		const outputZipBuffer = this.getZip().generate({
			compression: 'DEFLATE',
			type: 'nodebuffer',
		});
		await fs.writeFile(outputPptxFilePath, outputZipBuffer);
	}
}
