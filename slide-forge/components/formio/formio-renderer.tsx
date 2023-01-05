import { FormioForm } from '../../data/formio';
import { FormioHost, FormioHostEvent } from './formio-host';

export function FormioRenderer({
	data,
	form,
	handleDataChanged,
	handleDataSubmitted,
}: {
	data?: object;
	form: FormioForm;
	handleDataChanged?(data: object, isDataValid: boolean): void;
	handleDataSubmitted?(data: object): void;
}) {
	const queryParams: Record<string, string> = { formJson: JSON.stringify(form) };
	if (data) {
		queryParams.dataJson = JSON.stringify(data);
	}

	function handleEvent(event: FormioHostEvent): void {
		switch (event.type) {
			case 'data-changed':
				handleDataChanged?.(event.data, event.isDataValid);
				break;

			case 'data-submitted':
				handleDataSubmitted?.(event.data);
				break;
		}
	}

	return <FormioHost mode="renderer" queryParams={queryParams} handleEvent={handleEvent} />;
}
