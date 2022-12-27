import { DataModel } from 'dex';
import puppeteer, { Browser, ElementHandle, Page } from 'puppeteer';
import { ReplacementImage } from '../templater/templater';

const showWindow = true;

export async function updateGvosUpgradePathImage(
	data: DataModel,
	replaceImage: (replacementImage: ReplacementImage) => void,
) {
	// const imageDimensionsInches = {
	//     height: 4.5,
	//     width: 11.98,
	// };
	const oldImageMd5 = '4d7d87e247962f2474efd5e2dc8651cf';
	const tableSelector = '#mc-main-content > table';
	const upgradePathPageUrl =
		'https://docs.gigamon.com/doclib60/Content/GV-OS-Upgrade/Upgrade_Summary_Path___Standalone_Nodes.html';

	// Launch the browser and navigate to the page.
	const browser: Browser = await puppeteer.launch({
		// Maximize the viewport area instead of the default 800x600.
		defaultViewport: null,

		// Show the browser window to the user. The screenshot is wacky unless the browser has a
		// chance to render it for real.
		headless: !showWindow,
	});
	try {
		const page: Page = (await browser.pages())[0] ?? (await browser.newPage());
		await page.goto(upgradePathPageUrl);

		// Get a screenshot of the table.
		const table: ElementHandle | null = await page.$(tableSelector);
		if (!table) {
			throw new Error(
				`${updateGvosUpgradePathImage.name}: Element not found for selector '${tableSelector}'`,
			);
		}

		const newImageBuffer: Buffer | string = await table.screenshot({
			captureBeyondViewport: true,
		});
		if (typeof newImageBuffer === 'string') {
			throw new Error(
				`${updateGvosUpgradePathImage.name}: Unexpected encoding of table element image`,
			);
		}

		// Sub the new image in for the old.
		Object.assign(data, { upgradePathPageUrl });
		replaceImage({ newImageBuffer, oldImageExtension: 'png', oldImageMd5 });
	} finally {
		await browser.close();
	}
}
