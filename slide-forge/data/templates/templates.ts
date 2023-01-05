export type TemplateId = string;

export interface TemplateRequest {
	description: string;
	name: string;
}

export abstract class TemplateRequest {
	public static empty(): TemplateRequest {
		return {
			description: '',
			name: '',
		};
	}
}

export interface TemplateResponse extends TemplateRequest {
	id: TemplateId;
}

export type Template = TemplateRequest | TemplateResponse;
