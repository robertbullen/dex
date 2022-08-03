import puppeteer from 'puppeteer';

const selectors = {
	okta: {
		mfa: {
			submitButton: 'form[data-se="factor-push"] input[type="submit"]',
		},
		signin: {
			passwordInput: 'form[data-se="o-form"] #okta-signin-password',
			submitButton: 'form[data-se="o-form"] #okta-signin-submit',
			usernameInput: 'form[data-se="o-form"] #okta-signin-username',
		},
	},
};

/**
 * @param {{ password: string; username: string }} credentials
 * @param {boolean} [showWindow]
 * @returns {Promise<void>}
 */
export async function getReport(credentials, showWindow = false) {
	const browser = await puppeteer.launch({
		// Maximize the viewport area instead of the default 800x600.
		defaultViewport: null,

		// Show the browser window to the user.
		headless: !showWindow,

		slowMo: showWindow ? 200 : undefined,
	});
	const page = (await browser.pages())[0] ?? (await browser.newPage());

	await page.goto(
		'https://gigamon.lightning.force.com/lightning/r/Report/00O5Y00000D6KZ2UAN/view?queryScope=userFolders',
	);

	// Submit credentials to the signin form.
	await page.waitForSelector(selectors.okta.signin.submitButton);
	await page.type(selectors.okta.signin.usernameInput, credentials.username);
	await page.type(selectors.okta.signin.passwordInput, credentials.password);
	await page.click(selectors.okta.signin.submitButton);

	// Submit the MFA push form.
	await page.waitForSelector(selectors.okta.mfa.submitButton);
	await page.click(selectors.okta.mfa.submitButton);

	browser.disconnect();

	return new Promise((resolve) => setTimeout(resolve, 30000));
}
