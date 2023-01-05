#!/usr/bin/env npx ts-node

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import dayjs from 'dayjs';
import { DataModel } from 'dex';
import filenamify from 'filenamify';
import { existsSync } from 'fs';
import * as fs from 'fs/promises';
import open from 'open';
import * as path from 'path';
import { fileURLToPath } from 'url';
import yargsInteractive from 'yargs-interactive';
import { hideBin } from 'yargs/helpers';
import { loadDataFromFileSystem } from './src/data.js';
import { generateJsonSchema } from './src/json-schema.js';
import { generateOrgChart } from './src/org-chart.js';
import { updateGvosUpgradePathImage } from './src/slides/gvos-upgrade-path.js';
import { ReplacementImage, Templater } from './src/templater/templater.js';
// import { getReport } from './src/reports.mjs';

async function main(): Promise<void> {
	const args = await parseArguments();

	const experiment = false;
	if (experiment) {
		// await getReport(args);
	}

	// Load customer data.
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = path.dirname(__filename);

	const [gigamon, customer] = await Promise.all([
		loadDataFromFileSystem(path.resolve(__dirname, 'data/gigamon.yaml')),
		loadDataFromFileSystem(args.dataPath),
	]);

	const data = customer as DataModel;

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

	const orgFileName = filenamify(data.orgName);

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
			noteworthyPeople: data.meeting.noteworthyPeople,
			organization: data.gigamon,
			prune: true,
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
				path.join(args.outputDir, `${orgFileName} Org Chart.dot`),
				customerOrgChart.graph.to_dot(),
			),
			fs.writeFile(
				path.join(args.outputDir, `${orgFileName} Org Chart.svg`),
				customerOrgChart.svgImageBuffer,
			),
			fs.writeFile(
				path.join(args.outputDir, `${orgFileName} Org Chart.png`),
				customerOrgChart.pngImageBuffer,
			),
		]);
	}

	// Generate the slide deck.
	const replacementImages: ReplacementImage[] = [];

	function replaceImage(replacementImage: ReplacementImage): void {
		replacementImages.push(replacementImage);
	}

	replaceImage({
		newImageBuffer: gigamonOrgChart.pngImageBuffer,
		oldImageExtension: 'png',
		oldImageMd5: '806d699051334f4bb806bd8584979894',
	});
	replaceImage({
		oldImageMd5: '4ee110e505b11ef1ca5f98fabebe8e2f',
		oldImageExtension: 'png',
		newImageBuffer: customerOrgChart.pngImageBuffer,
	});

	await updateGvosUpgradePathImage(data, replaceImage);

	const meetingDate = dayjs(data.meeting.date).format('YYYY-MM-DD');
	const outputPptxFilePath = path.join(
		args.outputDir,
		`${orgFileName} Cadence ${meetingDate}.pptx`,
	);

	await Templater.execute(args.templateFile, data, replacementImages, outputPptxFilePath);

	// Open the newly created slide deck if the user wishes it.
	if (args.review) {
		open(outputPptxFilePath);
	}
}

async function parseArguments() {
	const yargs = yargsInteractive(hideBin(process.argv));
	const args = await yargs
		.help()
		.usage(
			[
				'Usage: $0',
				'-t=<path/to/template.pptx>',
				'-d=<path/to/data.yaml>',
				'-o=<path/to/output/dir/>',
				'[-m=<yyyy-mm-dd>]',
				'[-r] ',
				'[-s] ',
				// '[-u=<username>] ',
				// '[-p=<password>]',
			].join(' '),
		)
		.interactive({
			// Prompt the user for these arguments if they aren't supplied.
			'interactive': {
				default: true,
				// TODO: Ideally this would hide the option from the help output, but it doesn't.
				// Figure out another way.
				hidden: true,
			},
			'meeting-date': {
				// alias: 'm',
				default: 'today',
				describe:
					"The date when the meeting will take place, specified as 'today', 'tomorrow', or in 'yyyy-mm-dd' format.",
				group: 'Interactive Arguments',
				prompt: 'if-no-arg' as const,
				type: 'string',
			},
			// 'password': {
			// 	alias: 'p',
			// 	describe: 'The password to use when logging into Salesforce.',
			// 	group: 'Interactive Arguments',
			// 	prompt: 'if-empty' as const,
			// 	type: 'password',
			// },
			// 'username': {
			// 	alias: 'u',
			// 	describe: 'The username to use when logging into Salesforce.',
			// 	group: 'Interactive Arguments',
			// 	prompt: 'if-empty' as const,
			// 	type: 'string',
			// },

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

	// The yargs-interactive package doesn't recognize aliases, so it will treat `--meeting-date`
	// and `-m` (now commented out above) as distinct arguments. Catch this invalid usage.
	if (args.m) {
		throw new Error('Argument `-m` is not supported; use `--meeting-date` instead');
	}

	// yargs-interactive also doesn't automatically create camel case properties, so use
	// `meeting-date` as input and then make `meetingDate` consistent.
	let meetingDate: string = args['meeting-date'];
	if (meetingDate === 'today') {
		meetingDate = dayjs().format('YYYY-MM-DD');
	} else if (meetingDate === 'tomorrow') {
		meetingDate = dayjs().add(1, 'day').format('YYYY-MM-DD');
	}
	args.meetingDate = args['meeting-date'] = meetingDate;

	return args;
}

main();
