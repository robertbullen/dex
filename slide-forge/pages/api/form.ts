// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import * as fs from 'fs/promises';
import type { NextApiRequest, NextApiResponse } from 'next';

const formFilePath = '/Users/rbullen/code/dex/slide-forge/public/form.json';

export default async function handler(req: NextApiRequest, res: NextApiResponse<object>) {
	if (req.method === 'GET') {
		const formJson: string = await fs.readFile(formFilePath, 'utf8');
		const formObject: object = JSON.parse(formJson);
		res.status(200).json(formObject);
	} else if (req.method === 'POST') {
		const formObject: object = req.body;
		const formJson: string = JSON.stringify(formObject, undefined, '/t');
		await fs.writeFile(formFilePath, formJson);
		res.status(204).end();
	}
}
