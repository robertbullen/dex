import { FormioForm } from '../../data/formio';
import { FormioHost, FormioHostEvent } from './formio-host';

export function FormioBuilder({
	initialForm = FormioForm.empty(),
	handleFormChanged,
}: {
	initialForm?: FormioForm;
	handleFormChanged(form: FormioForm): void;
}) {
	const queryParams: Record<string, string> = { formJson: JSON.stringify(initialForm) };

	function handleEvent(event: FormioHostEvent): void {
		if (event.type === 'form-changed') {
			handleFormChanged(event.form);
		}
	}

	return <FormioHost mode="builder" queryParams={queryParams} handleEvent={handleEvent} />;
}
