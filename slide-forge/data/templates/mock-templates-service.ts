import { v4 as uuid } from 'uuid';
import { Template, TemplateId, TemplateResponse } from './templates';
import { TemplatesService } from './templates-service';

export class MockTemplatesService extends TemplatesService {
	public override async createOrUpdate(template: Template): Promise<TemplateResponse> {
		const newTemplate: TemplateResponse = {
			...template,
			id: 'id' in template ? template.id : uuid(),
		};
		this._templates.set(newTemplate.id, newTemplate);
		return newTemplate;
	}

	public override async delete(templateId: TemplateId): Promise<TemplateResponse> {
		const template: TemplateResponse | undefined = this._templates.get(templateId);
		if (!template) throw new Error(`Template with id='${templateId}' not found`);
		this._templates.delete(templateId);
		return template;
	}

	public override async read(templateId: TemplateId): Promise<TemplateResponse> {
		const template: TemplateResponse | undefined = this._templates.get(templateId);
		if (!template) throw new Error(`Template with id='${templateId}' not found`);
		return template;
	}

	public override async readAll(): Promise<TemplateResponse[]> {
		return Array.from(this._templates.values());
	}

	private readonly _templates = new Map<TemplateId, TemplateResponse>(
		[
			{
				description:
					'This deck is helpful for regular, structured meetings with existing customers',
				name: 'SE Cadence',
				formId: 'a061c9b7-0222-460d-912b-de5216e119d4',
				id: '5a9e3400-ea72-4459-8b05-86dc7d2a26bb',
				powerpointId: '3f0ccb4b-eacf-4741-af71-13dd48e033b8',
				version: 1,
			},
			{
				description:
					'This deck showcases upcoming products and features and can be tailored to the audience',
				name: 'Roadmap',
				formId: '07eede66-a3e9-4b0f-be58-f216b3bc1340',
				id: '41195df6-aaf0-42e3-b630-342e2ee44eda',
				powerpointId: '46377157-c1d0-4ded-bb24-5b87c28a850b',
				version: 1,
			},
			{
				description: 'This deck describes the cloud solution for the selected platforms',
				name: 'HAWK Overview',
				formId: 'a525b912-81d3-47a1-a1a6-37e31b5594cf',
				id: 'd7a48eb3-9dc5-45fc-9460-dd2580f48a99',
				powerpointId: 'e2d94e4d-4176-42f4-aedd-172e18b50156',
				version: 1,
			},
		].map((template: TemplateResponse): [TemplateId, TemplateResponse] => [
			template.id,
			template,
		]),
	);
}
