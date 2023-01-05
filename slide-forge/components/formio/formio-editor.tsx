import { useState } from 'react';
import { FormioForm } from '../../data/formio';
import { CancelSaveBar } from '../layout/cancel-save-bar';
import { Stack } from '../layout/stack';
import { Tabs } from '../layout/tabs';
import { FormioBuilder } from './formio-builder';
import { FormioDataViewer } from './formio-data-viewer';
import { FormioRenderer } from './formio-renderer';

export const FormioEditorAction = {
	designInBuilder: 'design-in-builder',
	previewDataEntry: 'preview-data-entry',
	viewSampleData: 'view-sample-data',
} as const;

export type FormioEditorAction = typeof FormioEditorAction[keyof typeof FormioEditorAction];

export function isFormioEditorAction(value: unknown): value is FormioEditorAction {
	return Object.values(FormioEditorAction).includes(value as any);
}

export function FormioEditor({
	action,
	handleCancel,
	handleSave,
	initialForm = FormioForm.empty(),
}: {
	action: FormioEditorAction;
	handleCancel(): void;
	handleSave(form: object): void;
	initialForm?: FormioForm;
}) {
	const [form, setForm] = useState(initialForm);
	const [data, setData] = useState<object>({});

	const initialActiveTab: number = Math.max(0, Object.values(FormioEditorAction).indexOf(action));

	return (
		<Stack>
			<CancelSaveBar
				handleCancel={handleCancel}
				handleSave={() => handleSave(form)}
				isSaveEnabled={form !== initialForm}
			/>

			<Tabs
				initialActiveTab={initialActiveTab}
				titles={['Designer', 'Previewer', 'Data Sample']}
			>
				<FormioBuilder initialForm={initialForm} handleFormChanged={setForm} />
				<FormioRenderer data={data} form={form} handleDataChanged={setData} />
				<FormioDataViewer data={data} />
			</Tabs>
		</Stack>
	);
}
