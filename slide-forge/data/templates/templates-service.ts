import { Template, TemplateId, TemplateResponse } from './templates';

export abstract class TemplatesService {
	// public static get singleton(): TemplatesService {
	// 	return (TemplatesService._singleton ??= new MockTemplatesService());
	// }
	// private static _singleton: TemplatesService | undefined;

	public static readonly swrKeys = {
		createOrUpdate(template: Template): string {
			return 'id' in template ? `PUT /templates/${template.id}` : `POST /templates`;
		},

		delete(templateId: string): string {
			return `DELETE /templates/${templateId}`;
		},

		read(templateId: TemplateId): string {
			return `GET /templates/${templateId}`;
		},

		readAll(): string {
			return 'GET /templates';
		},
	};

	public static search<TTemplate extends Template>(
		templates: readonly TTemplate[],
		searchRegex: RegExp,
	): TTemplate[] {
		return templates.filter(
			(template: Template): boolean =>
				searchRegex.test(template.name) || searchRegex.test(template.description),
		);
	}

	public static sort<TTemplate extends Template>(templates: readonly TTemplate[]): TTemplate[] {
		return templates
			.slice()
			.sort(
				(a: Template, b: Template): number =>
					a.name.localeCompare(b.name) || a.description.localeCompare(b.description),
			);
	}

	public abstract createOrUpdate(template: Template): Promise<TemplateResponse>;

	public abstract delete(templateId: TemplateId): Promise<TemplateResponse>;

	public abstract read(templateId: TemplateId): Promise<TemplateResponse>;
	public abstract readAll(): Promise<TemplateResponse[]>;
}
