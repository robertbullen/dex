import { useRouter } from 'next/router';
import {
	FormioEditor,
	FormioEditorAction,
	isFormioEditorAction,
} from '../../../components/formio/formio-editor';
import { Page } from '../../../components/layout/page';

export default function FormEditorPage() {
	const router = useRouter();

	const action = isFormioEditorAction(router.query.action)
		? router.query.action
		: FormioEditorAction.designInBuilder;

	const formJson: string | undefined =
		(typeof window !== 'undefined' && window.localStorage.getItem('form')) || undefined;
	const form: object | undefined = formJson && JSON.parse(formJson);

	function handleCancel(): void {
		router.back();
	}

	function handleSave(newForm: object): void {
		typeof window !== 'undefined' &&
			window.localStorage.setItem('form', JSON.stringify(newForm));
		router.back();
	}

	return (
		<Page title="Form Editor">
			<FormioEditor
				action={action}
				initialForm={form}
				handleCancel={handleCancel}
				handleSave={handleSave}
			/>
		</Page>
	);
}
