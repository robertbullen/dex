import svgToPng from 'convert-svg-to-png';
import { Organization, Person, StaffMember } from 'dex';
import graphviz from 'graphviz';
import xml2js from 'xml2js';

const dimensions = {
	graph: {
		// Matches PowerPoint's default 16:9 template.
		heightInches: 7.5,

		labelFontSize: 40,
		paddingInches: 0.5,
		pixelsPerInch: 240,

		// Matches PowerPoint's default 16:9 template.
		widthInches: 13.333,
	},
	cluster: {
		labelFontSize: 24,
	},
	node: {
		heightInches: 0.75,
		labelFontSize: 14,
		widthInches: 3.25,
	},
};

export interface GenerateOrgChartParams {
	/**
	 * People that are highlighted in a strong manner.
	 */
	accentedPeople?: Person[];

	/**
	 * The CSS to apply to the SVG image.
	 */
	css: string;

	/**
	 * The height to target when generating the final graphic.
	 *
	 * @default 7.5
	 */
	heightInches?: number;

	/**
	 * People that are highlighted less strongly than {@link accentedPeople}.
	 */
	noteworthyPeople?: Person[];

	/**
	 * The organization to render.
	 */
	organization: Organization;

	/**
	 * The pixels per inch to use when rasterizing the final graphic.
	 */
	pixelsPerInch?: number;

	/**
	 * When `true`, prunes all people who are not linked to either {@link accentedPeople} or {@link noteworthyPeople}.
	 * @default false
	 */
	prune?: boolean;

	/**
	 * The width to target when generating the final graphic.
	 *
	 * @default 13.333
	 */
	widthInches?: number;
}

export interface GenerateOrgChartResult {
	graph: graphviz.Graph;
	pngImageBuffer: Buffer;
	svgImageBuffer: Buffer;
}

/**
 * Generates an org chart graphic.
 *
 * This implementation uses the following pipeline:
 *
 * 1. Use GraphViz to describe the org chart.
 * 2. Export the GraphViz structure to SVG.
 * 3. Modify the SVG to correct proportions and inject CSS.
 * 4. Use Chromium to rasterize the SVG to PNG.
 */
export async function generateOrgChart(
	args: GenerateOrgChartParams,
): Promise<GenerateOrgChartResult> {
	// Supply reasonable default values.
	const newArgs: Required<GenerateOrgChartParams> = {
		...args,
		accentedPeople: args.accentedPeople ?? [],
		heightInches: args.heightInches ?? dimensions.graph.heightInches,
		noteworthyPeople: args.noteworthyPeople ?? [],
		pixelsPerInch: args.pixelsPerInch ?? dimensions.graph.pixelsPerInch,
		prune: args.prune ?? false,
		widthInches: args.widthInches ?? dimensions.graph.widthInches,
	};

	const staff = newArgs.prune
		? pruneStaff(
				newArgs.organization.staff,
				newArgs.accentedPeople,
				newArgs.noteworthyPeople,
		  ) ?? []
		: newArgs.organization.staff;

	// Populate the diagram over multiple passes.
	const graph = createOrganizationGraph(newArgs, staff);
	addTeamClusters(newArgs, staff, graph);
	const staffNodes = addStaffNodes(newArgs, staff, graph);
	addStaffEdges(newArgs, staff, graph, staffNodes);
	addRankClusters(newArgs, staff, graph);

	// Generate the SVG image. It is possible to supply the `.render()` method an output file path
	// for the second argument instead of a callback, and the file will be written directly by
	// graphviz. The drawback is that the file is created asynchronously without notification, and
	// there's more work to do on the SVG, so manually wrapping with a Promise avoids watching for
	// and opening a file from disk.
	const oldSvgImageBuffer: Buffer = await new Promise<Buffer>((resolve, reject): void =>
		graph.render(
			'svg',
			(stdout) => {
				resolve(stdout);
			},
			(_code, _stdout, stderr) => {
				reject(new Error(stderr));
			},
		),
	);

	// The resulting SVG may not be of the desired dimensions, so manipulate its XML to resize it,
	// center the content, and place a new background layer behind it all (to avoid letterboxing
	// or pillarboxing). Start by deserializing to an in-memory object representation of the XML.
	const oldSvgDoc = await xml2js.parseStringPromise(oldSvgImageBuffer);

	// Parse the viewport and viewbox.
	const oldViewport = {
		width: Number.parseFloat(oldSvgDoc.svg.$.width),
		height: Number.parseFloat(oldSvgDoc.svg.$.height),
	};

	const viewboxDimensions = oldSvgDoc.svg.$.viewBox.split(' ').map(Number.parseFloat);
	const oldViewbox = {
		x: viewboxDimensions[0],
		y: viewboxDimensions[1],
		width: viewboxDimensions[2],
		height: viewboxDimensions[3],
	};

	// Resize the viewport and viewbox.
	const newViewport = { ...oldViewport };
	const newViewbox = { ...oldViewbox };

	const aspectRatio: number = newArgs.widthInches / newArgs.heightInches;
	if (oldViewport.width / oldViewport.height > aspectRatio) {
		newViewport.height = oldViewport.width / aspectRatio;
		newViewbox.height = newViewport.height;
		newViewbox.y = (oldViewbox.height - newViewbox.height) / 2;
	} else {
		newViewport.width = oldViewport.height * aspectRatio;
		newViewbox.width = newViewport.width;
		newViewbox.x = (oldViewbox.width - newViewbox.width) / 2;
	}

	// Compose the new SVG document. It's mostly the same, except for adding CSS inside a <style>
	// element, a background <rect> to cover the full dimensions, and overwriting the root <svg>
	// element's viewbox and viewport attributes.
	const newSvgDoc = {
		svg: {
			style: args.css,
			rect: {
				$: {
					...newViewbox,
				},
			},
			...oldSvgDoc.svg,
			$: {
				...oldSvgDoc.svg.$,
				width: `${newViewport.width}pt`,
				height: `${newViewport.height}pt`,
				viewBox: [newViewbox.x, newViewbox.y, newViewbox.width, newViewbox.height].join(
					' ',
				),
			},
		},
	};

	// Serialize to in-memory XML.
	const builder = new xml2js.Builder({
		renderOpts: {
			indent: '\t',
			newline: '\n',
			pretty: true,
		},
	});
	const newSvgImageBuffer: Buffer = Buffer.from(builder.buildObject(newSvgDoc));

	// PowerPoint's SVG rendering has some limitations, so convert the SVG to PNG in order to
	// capture the most accurate rendering possible.
	const pngImageBuffer: Buffer = await svgToPng.convert(newSvgImageBuffer, {
		height: newArgs.heightInches * newArgs.pixelsPerInch,
		width: newArgs.widthInches * newArgs.pixelsPerInch,
	});

	return {
		graph,
		pngImageBuffer,
		svgImageBuffer: newSvgImageBuffer,
	};
}

function createOrganizationGraph(
	args: Required<GenerateOrgChartParams>,
	staff: StaffMember[],
): graphviz.Graph {
	const graph = graphviz.graph(args.organization.orgName);

	// Determine whether the org chart will be taller or wider.
	let breadth = 0;
	let depth = 0;
	traverseStaff(staff, (staffMember, hierarchy) => {
		if (!staffMember.staff) {
			breadth++;
		}
		depth = Math.max(depth, hierarchy.length + 1);

		return true;
	});

	// Configure the default styles of chart elements.
	const graphAttributes = {
		clusterrank: 'local', // Show clusters; arrange nodes locally within clusters and then arrange clusters.
		// clusterrank: 'global', // Hide clusters; arrange nodes globally without regard to clusters.
		fontsize: dimensions.graph.labelFontSize,
		label: `${args.organization.orgName} Org Chart`,
		labelloc: 'top',
		newrank: true,
		pad: dimensions.graph.paddingInches,
		rankdir:
			args.organization.orgChartDirection ?? (breadth > 3 && breadth > depth ? 'LR' : 'TB'),
		ratio: 'fill',
		size: `${args.widthInches},${args.heightInches}`,
		splines: 'ortho',
	};
	for (const [key, value] of Object.entries(graphAttributes)) {
		graph.set(key, value);
	}

	return graph;
}

function teamClusterId(team: string): string {
	return `cluster ${team}`;
}

function addTeamClusters(
	_args: Required<GenerateOrgChartParams>,
	staff: StaffMember[],
	graph: graphviz.Graph,
): void {
	traverseStaff(staff, (staffMember: StaffMember, _hierarchy: readonly StaffMember[]): true => {
		const clusterId: string = teamClusterId(staffMember.person.team);
		let cluster: graphviz.Graph | undefined = graph.getCluster(clusterId);
		if (!cluster) {
			cluster = graph.addCluster(clusterId);

			const clusterAttributes = {
				fontsize: dimensions.cluster.labelFontSize,
				label: staffMember.person.team,
				labelloc: 'top',
				style: 'filled',
			};
			for (const [key, value] of Object.entries(clusterAttributes)) {
				cluster.set(key, value);
			}
		}

		return true;
	});
}

function addStaffNodes(
	args: Required<GenerateOrgChartParams>,
	staff: StaffMember[],
	graph: graphviz.Graph,
): Map<string, graphviz.Node> {
	const staffNodes = new Map<string, graphviz.Node>();

	traverseStaff(staff, (staffMember: StaffMember, _hierarchy: readonly StaffMember[]): true => {
		const teamCluster: graphviz.Graph | undefined = graph.getCluster(
			teamClusterId(staffMember.person.team),
		);
		if (!teamCluster) throw new Error();

		// Determine whether the person is accented or noteworthy.
		const isAccented: boolean = !!findPersonByValue(args.accentedPeople, staffMember.person);
		const isNoteworthy: boolean = !!findPersonByValue(
			args.noteworthyPeople,
			staffMember.person,
		);

		// Generate a multi-line label for the person, prefixed with an exclamation to have it
		// interpreted as [HTML-like](https://graphviz.org/doc/info/shapes.html#html).
		const labelLines: string[] = [
			staffMember.person.name,
			staffMember.person.title ?? 'Title?',
		];
		if (staffMember.person.specialties?.length) {
			labelLines.push(`(${staffMember.person.specialties.join(', ')})`);
		}

		let href: string | undefined = staffMember.person.url;
		if (!href && staffMember.person.urls?.length) {
			href = staffMember.person.urls[0]?.url;
		}

		const nodeAttributes = {
			class: isAccented ? 'accent' : isNoteworthy ? 'note' : 'default',
			fontsize: dimensions.node.labelFontSize,
			height: dimensions.node.heightInches,
			href,
			label: labelLines.join('\n'),
			shape: 'rectangle',
			style: 'filled,rounded',
			width: dimensions.node.widthInches,
		};
		const node: graphviz.Node = teamCluster.addNode(staffMember.person.name, nodeAttributes);

		staffNodes.set(staffMember.person.name, node);

		return true;
	});

	return staffNodes;
}

function addStaffEdges(
	_args: Required<GenerateOrgChartParams>,
	staff: StaffMember[],
	graph: graphviz.Graph,
	staffNodes: Map<string, graphviz.Node>,
): void {
	traverseStaff(staff, (staffMember: StaffMember, _hierarchy: readonly StaffMember[]): true => {
		if (staffMember.staff?.length) {
			const node1: graphviz.Node | undefined = staffNodes.get(staffMember.person.name);
			if (!node1) throw new Error();

			for (const subordinate of staffMember.staff) {
				const node2: graphviz.Node | undefined = staffNodes.get(subordinate.person.name);
				if (!node2) throw new Error();

				const _edge: graphviz.Edge = graph.addEdge(node1, node2);
			}
		}
		return true;
	});
}

function addRankClusters(
	args: Required<GenerateOrgChartParams>,
	staff: StaffMember[],
	graph: graphviz.Graph,
): void {
	// These are listed in order of priority from top to bottom.
	type Rank = 'source' | 'min' | 'same' | 'max' | 'sink';

	function createRankCluster(parentName: string, rank: Rank = 'same'): graphviz.Graph {
		const rankCluster: graphviz.Graph = graph.addCluster(`${parentName} Staff`);
		if (rank) {
			rankCluster.set('rank', rank);
		}
		return rankCluster;
	}

	function createAndPopulateRankClusterIfNecessary(
		parentName: string,
		staff: StaffMember[] | undefined,
		rank: Rank = 'same',
	): graphviz.Graph | undefined {
		let rankCluster: graphviz.Graph | undefined;
		if (staff && staff.length > 1) {
			rankCluster = createRankCluster(parentName, rank);
			for (const staffMember of staff) {
				rankCluster.addNode(staffMember.person.name);
			}
		}
		return rankCluster;
	}

	if (args.organization.orgChartJustification === 'roots') {
		const _rootRankCluster: graphviz.Graph | undefined =
			createAndPopulateRankClusterIfNecessary(
				`${args.organization.orgName} Root`,
				staff.filter((staffMember) => !!staffMember.staff),
				'source',
			);

		traverseStaff(
			staff,
			(staffMember: StaffMember, _hierarchy: readonly StaffMember[]): true => {
				createAndPopulateRankClusterIfNecessary(staffMember.person.name, staffMember.staff);
				return true;
			},
		);
	} else if (args.organization.orgChartJustification === 'leaves') {
		const leafRankCluster: graphviz.Graph = createRankCluster(
			`${args.organization.orgName} Leaf`,
			'sink',
		);

		traverseStaff(
			staff,
			(staffMember: StaffMember, _hierarchy: readonly StaffMember[]): true => {
				if (!staffMember.staff) {
					leafRankCluster.addNode(staffMember.person.name);
				}
				return true;
			},
		);
	}
}

function pruneStaff(
	staff: StaffMember[] | undefined,
	accentedPeople: Person[],
	noteworthyPeople: Person[],
): StaffMember[] | undefined {
	return traverseStaff(
		staff,
		(staffMember: StaffMember, _hierarchy: readonly StaffMember[]): boolean =>
			!!findPersonByValue(accentedPeople, staffMember.person) ||
			!!findPersonByValue(noteworthyPeople, staffMember.person),
	);
}

type StaffMemberVisitor = (staffMember: StaffMember, hierarchy: readonly StaffMember[]) => boolean;

function traverseStaff(
	staff: StaffMember[] | undefined,
	visitStaffMember: StaffMemberVisitor,
): StaffMember[] | undefined {
	function recurseStaff(
		oldStaff: StaffMember[] | undefined,
		hierarchy: StaffMember[],
	): StaffMember[] | undefined {
		let newStaff: StaffMember[] | undefined;
		if (oldStaff) {
			for (const oldStaffMember of oldStaff) {
				hierarchy.push(oldStaffMember);
				const newStaffMember: StaffMember = {
					...oldStaffMember,
					staff: recurseStaff(oldStaffMember.staff, hierarchy),
				};
				hierarchy.pop();

				if (visitStaffMember(oldStaffMember, hierarchy) || newStaffMember.staff?.length) {
					newStaff ??= [];
					newStaff.push(newStaffMember);
				}
			}
		}

		return newStaff;
	}

	return recurseStaff(staff, []);
}

function findPersonByValue(people: Person[], person: Person): Person | undefined {
	// Person.name and Person.team are the only two required properties.
	return people.find((p) => p.name === person.name && p.team === person.team);
}
