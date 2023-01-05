export interface FormioForm {
	components?: object[];
	display?: 'form' | 'wizard' | 'pdf';
}

export abstract class FormioForm {
	public static empty(): FormioForm {
		return {
			// display: 'form',
		};
	}
}
