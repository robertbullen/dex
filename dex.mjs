#!/usr/bin/env node

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import dayjs from 'dayjs';
import * as fs from 'fs/promises';
import { existsSync } from 'fs';
import open from 'open';
import * as path from 'path';
import { fileURLToPath } from 'url';
import yargsInteractive from 'yargs-interactive';
import { hideBin } from 'yargs/helpers';
import { loadDataFromFileSystem } from './src/data.mjs';
import { generateJsonSchema } from './src/json-schema.mjs';
import { generateOrgChart } from './src/org-chart.mjs';
import { generatePowerpoint } from './src/powerpoint.mjs';
import { getReport } from './src/reports.mjs';
import { updateGvosUpgradePathImage } from './src/slides/gvos-upgrade-path.mjs';

async function main() {
	const args = await parseArguments();

	const experiment = false;
	if (experiment) {
		await getReport(args);
	}

	// Load customer data.
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = path.dirname(__filename);

	const [gigamon, customer] = await Promise.all([
		loadDataFromFileSystem(path.resolve(__dirname, 'data/gigamon.yaml')),
		loadDataFromFileSystem(args.dataPath),
	]);

	const data = /** @type {DataModelType} */ (customer);
	data.gigamon = gigamon;
	data.meeting.date = args.meetingDate;

	// Validate the data.
	const schema = generateJsonSchema('DataModel', 'validator');

	const ajv = new Ajv();
	addFormats(ajv);

	const validate = ajv.compile(schema);

	const isValid = validate(data);
	if (!isValid) {
		console.log(validate.errors);
	}

	// Generate org chart images to be substituted into the slide deck.
	const gigamonCssFilePath = path.resolve(__dirname, 'data/gigamon.css');
	const gigamonCss = await fs.readFile(gigamonCssFilePath, 'utf8');

	const customerCssFilePath = path.format(
		Object.assign(path.parse(args.dataPath), {
			ext: '.css',
			base: undefined,
		}),
	);
	const customerCss = existsSync(customerCssFilePath)
		? await fs.readFile(customerCssFilePath, 'utf8')
		: gigamonCss;

	const [gigamonOrgChart, customerOrgChart] = await Promise.all([
		generateOrgChart({
			accentedPeople: data.meeting.invitees,
			css: gigamonCss,
			organization: data.gigamon,
		}),
		generateOrgChart({
			accentedPeople: data.meeting.invitees,
			css: customerCss,
			organization: data,
		}),
	]);

	if (args.saveOrgCharts) {
		await fs.mkdir(args.outputDir, { recursive: true });
		await Promise.all([
			fs.writeFile(
				path.join(args.outputDir, 'Gigamon Org Chart.dot'),
				gigamonOrgChart.graph.to_dot(),
			),
			fs.writeFile(
				path.join(args.outputDir, 'Gigamon Org Chart.svg'),
				gigamonOrgChart.svgImageBuffer,
			),
			fs.writeFile(
				path.join(args.outputDir, 'Gigamon Org Chart.png'),
				gigamonOrgChart.pngImageBuffer,
			),
			fs.writeFile(
				path.join(args.outputDir, `${data.orgName} Org Chart.dot`),
				customerOrgChart.graph.to_dot(),
			),
			fs.writeFile(
				path.join(args.outputDir, `${data.orgName} Org Chart.svg`),
				customerOrgChart.svgImageBuffer,
			),
			fs.writeFile(
				path.join(args.outputDir, `${data.orgName} Org Chart.png`),
				customerOrgChart.pngImageBuffer,
			),
		]);
	}

	// Generate the slide deck.
	/** @type {import('./src/templater.mjs').ReplacementImage[]}*/
	const replacementImages = [];

	/**
	 * @param {import('./src/templater.mjs').ReplacementImage} replacementImage
	 * @returns {void}
	 */
	function replaceImage(replacementImage) {
		replacementImages.push(replacementImage);
	}

	replaceImage({
		newImageBuffer: gigamonOrgChart.svgImageBuffer,
		oldImageExtension: 'svg',
		oldImageMd5: '7b2fa5e5c29d7ef609fcba48107d1701',
	});
	replaceImage({
		oldImageMd5: 'd835197c255e2dc8aef259907ea9155a',
		oldImageExtension: 'svg',
		newImageBuffer: customerOrgChart.svgImageBuffer,
	});

	await updateGvosUpgradePathImage(data, replaceImage);

	const meetingDate = dayjs(data.meeting.date).format('YYYY-MM-DD');
	const outputPptxFilePath = path.join(
		args.outputDir,
		`${data.orgName} Cadence ${meetingDate}.pptx`,
	);

	await generatePowerpoint(args.templateFile, data, replacementImages, outputPptxFilePath);

	// Open the newly created slide deck if the user wishes it.
	if (args.review) {
		open(outputPptxFilePath);
	}
}

function parseArguments() {
	const yargs = yargsInteractive(hideBin(process.argv));
	return yargs
		.help()
		.usage(
			'Usage: $0 -t=<path/to/template.pptx> -d=<path/to/data.yaml> -o=<path/to/output/dir/> [-m=<yyyy-mm-dd>] [-r] [-s] [-u=<username>] [-p=<password>]',
		)
		.interactive({
			// Prompt the user for these arguments if they aren't supplied.
			'interactive': { default: true },
			'meeting-date': {
				alias: 'm',
				describe:
					'The date when the meeting will take place, specified in yyyy-mm-dd format.',
				group: 'Interactive Arguments',
				prompt: /** @type {'if-empty'} */ ('if-empty'),
				type: 'string',
			},
			'password': {
				alias: 'p',
				describe: 'The password to use when logging into Salesforce.',
				group: 'Interactive Arguments',
				prompt: /** @type {'if-empty'} */ ('if-empty'),
				type: 'password',
			},
			'username': {
				alias: 'u',
				describe: 'The username to use when logging into Salesforce.',
				group: 'Interactive Arguments',
				prompt: /** @type {'if-empty'} */ ('if-empty'),
				type: 'string',
			},

			// Don't prompt the user for these arguments.
			'data-path': {
				alias: 'd',
				coerce: (value) => path.resolve(value),
				demandOption: true,
				describe:
					'File or directory path containing the customer data to substitute into the template PowerPoint slide deck. When a directory is specified, all JSON, YAML, and JavaScript modules (*.mjs) will be loaded and merged into a single object.',
				group: 'Noninteractive Arguments',
				type: 'string',
			},
			'output-dir': {
				alias: 'o',
				coerce: (value) => path.resolve(value),
				demandOption: true,
				describe:
					'Directory path where the generated PowerPoint slide deck will be written; its file name will be created from the customer data.',
				group: 'Noninteractive Arguments',
				type: 'string',
			},
			'review': {
				alias: 'r',
				default: false,
				describe: 'Open the generated PowerPoint slide deck once complete.',
				group: 'Noninteractive Arguments',
				type: 'boolean',
			},
			'save-org-charts': {
				alias: 's',
				default: false,
				describe:
					'Save generated org charts in their intermediate formats (DOT and SVG) for examination.',
				group: 'Noninteractive Arguments',
				type: 'boolean',
			},
			'template-file': {
				alias: 't',
				coerce: (value) => path.resolve(value),
				demandOption: true,
				describe: 'File path to a template PowerPoint slide deck.',
				group: 'Noninteractive Arguments',
				type: 'string',
			},
		});
}

main();
