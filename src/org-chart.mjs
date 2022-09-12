import svgToPng from 'convert-svg-to-png';
import graphviz from 'graphviz';
import xml2js from 'xml2js';

const rankClusterId = '__rank';

const dimensions = {
	graph: {
		heightInches: 7.5,
		labelFontSize: 40,
		paddingInches: 0.5,
		pixelsPerInch: 240,
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

/**
 * @typedef {object} GenerateOrgChartParams
 * @property {Person[]} accentedPeople
 * @property {string} css
 * @property {number} [heightInches=13.333]
 * @property {OrganizationType} organization
 * @property {number} [pixelsPerInch=240]
 * @property {number} [widthInches=7.5]
 *
 * @typedef {object} GenerateOrgChartResult
 * @property {graphviz.Graph} graph
 * @property {Buffer} pngImageBuffer
 * @property {Buffer} svgImageBuffer
 */

/**
 * Generates an org chart using GraphViz, rendered as SVG and PNG images.
 *
 * There are a couple advantages to generating org charts as SVGs here: First, as with any vector
 * graphic, is the image will scale nicely with the presentation. Second, and more importantly, is
 * the font that Gigamon uses in its PowerPoint decks is Century Gothic, which is not freely
 * available outside of Microsoft Office. SVG images only specify the desired fonts, it is up to
 * the renderer to supply them. In this case, Microsoft Office will be the renderer and the font
 * will be available.
 *
 * @param {GenerateOrgChartParams} args
 * @returns {Promise<GenerateOrgChartResult>}
 */
export async function generateOrgChart(args) {
	// Supply reasonable default values.
	const newArgs = Object.assign(
		{
			heightInches: dimensions.graph.heightInches,
			pixelsPerInch: dimensions.graph.pixelsPerInch,
			widthInches: dimensions.graph.widthInches,
		},
		args,
	);

	// Populate the diagram over multiple passes.
	const graph = createOrganizationGraph(newArgs);
	addTeamClusters(newArgs, graph);
	const staffNodes = addStaffNodes(newArgs, graph);
	addStaffEdges(newArgs, graph, staffNodes);

	// Generate the SVG image. It is possible to supply the `.render()` method an output file path
	// for the second argument instead of a callback, and the file will be written directly by
	// graphviz. The drawback is that the file is created asynchronously without notification, and
	// there's more work to do on the SVG, so manually wrapping with a Promise avoids watching for
	// and opening a file from disk.
	/** @type {Buffer} */
	const oldSvgImageBuffer = await new Promise((resolve, reject) =>
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

	const aspectRatio = newArgs.widthInches / newArgs.heightInches;
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
	const newSvgImageBuffer = Buffer.from(builder.buildObject(newSvgDoc));

	// PowerPoint's SVG rendering has some limitations, so convert the SVG to PNG in order to
	// capture the most accurate rendering possible.
	const pngImageBuffer = await svgToPng.convert(newSvgImageBuffer, {
		height: newArgs.heightInches * newArgs.pixelsPerInch,
		width: newArgs.widthInches * newArgs.pixelsPerInch,
	});

	return {
		graph,
		pngImageBuffer,
		svgImageBuffer: newSvgImageBuffer,
	};
}

/**
 * @param {GenerateOrgChartParams} args
 * @returns {graphviz.Graph}
 */
function createOrganizationGraph(args) {
	const graph = graphviz.graph(args.organization.orgName);

	// Determine whether the org chart will be taller or wider.
	let breadth = 0;
	let depth = 0;
	traverseStaff(args.organization.staff, (staffMember, hierarchy) => {
		if (!staffMember.staff) {
			breadth++;
		}
		depth = Math.max(depth, hierarchy.length + 1);
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

	// Add a special cluster used for ranking all leaf nodes to align at the bottom.
	const rankCluster = graph.addCluster(rankClusterId);
	rankCluster.set('rank', 'same');

	return graph;
}

/**
 *
 * @param {string} team
 * @returns {string}
 */
function teamClusterId(team) {
	return `cluster ${team}`;
}

/**
 * @param {GenerateOrgChartParams} args
 * @param {graphviz.Graph} graph
 * @returns {void}
 */
function addTeamClusters(args, graph) {
	traverseStaff(args.organization.staff, (staffMember) => {
		const clusterId = teamClusterId(staffMember.person.team);
		let cluster = graph.getCluster(clusterId);
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
	});
}

/**
 * @param {GenerateOrgChartParams} args
 * @param {graphviz.Graph} graph
 * @returns {Map<string, graphviz.Node>}
 */
function addStaffNodes(args, graph) {
	/** @type {Map<string, graphviz.Node>} */
	const staffNodes = new Map();

	traverseStaff(args.organization.staff, (staffMember) => {
		const teamCluster = graph.getCluster(teamClusterId(staffMember.person.team));
		if (!teamCluster) throw new Error();

		// Determine whether the person is accented.
		const isAccented = !!args.accentedPeople.find(
			// Person.name and Person.team are the only two required properties.
			(accentedPerson) =>
				staffMember.person.name === accentedPerson.name &&
				staffMember.person.team === accentedPerson.team,
		);

		// Generate a multi-line label for the person, prefixed with an exclamation to have it
		// interpreted as [HTML-like](https://graphviz.org/doc/info/shapes.html#html).
		const labelLines = [staffMember.person.name, staffMember.person.title ?? 'Title?'];
		if (staffMember.person.specialties?.length) {
			labelLines.push(`(${staffMember.person.specialties.join(', ')})`);
		}

		let href = staffMember.person.url;
		if (!href && staffMember.person.urls?.length) {
			href = staffMember.person.urls[0].url;
		}

		const nodeAttributes = {
			class: isAccented ? 'accent' : 'default',
			fontsize: dimensions.node.labelFontSize,
			height: dimensions.node.heightInches,
			href,
			label: labelLines.join('\n'),
			shape: 'rectangle',
			style: 'filled,rounded',
			width: dimensions.node.widthInches,
		};
		const node = teamCluster.addNode(staffMember.person.name, nodeAttributes);

		// If this is a leaf node, add it to the special rank cluster to align them all at the
		// bottom.
		if (!staffMember.staff) {
			const rankCluster = graph.getCluster(rankClusterId);
			rankCluster.addNode(node.id);
		}

		staffNodes.set(staffMember.person.name, node);
	});

	return staffNodes;
}

/**
 * @param {GenerateOrgChartParams} args
 * @param {graphviz.Graph} graph
 * @param {Map<string, graphviz.Node>} staffNodes
 * @returns {void}
 */
function addStaffEdges(args, graph, staffNodes) {
	traverseStaff(args.organization.staff, (staffMember) => {
		if (staffMember.staff?.length) {
			const node1 = staffNodes.get(staffMember.person.name);
			if (!node1) throw new Error();

			for (const subordinate of staffMember.staff) {
				const node2 = staffNodes.get(subordinate.person.name);
				if (!node2) throw new Error();

				const _edge = graph.addEdge(node1, node2);
			}
		}
	});
}

/**
 * @typedef {(staffMember: StaffMember, hierarchy: StaffMember[]) => void} StaffMemberVisitor
 */

/**
 * @param {StaffMember[] | undefined} staff
 * @param {StaffMemberVisitor} visitStaffMember
 */
function traverseStaff(staff, visitStaffMember) {
	/**
	 * @param {StaffMember[] | undefined} staff
	 * @param {StaffMember[]} hierarchy
	 */
	function recurseStaff(staff, hierarchy) {
		if (staff?.length) {
			for (const staffMember of staff) {
				visitStaffMember(staffMember, hierarchy);
				recurseStaff(staffMember.staff, hierarchy.concat(staffMember));
			}
		}
	}

	recurseStaff(staff, []);
}
