import { ChangeEvent, useMemo, useState } from 'react';
import { Form, FormGroup, Input, Label } from 'reactstrap';
import YAML from 'yaml';
import { Stack } from '../layout/stack';

import dynamic from 'next/dynamic';

const TextEditor = dynamic(() => import('./text-editor').then((module) => module.TextEditor), {
	ssr: false,
});

export const FormioDataViewerMode = {
	yaml: 'yaml',
	json: 'json',
} as const;

export type FormioDataViewerMode = typeof FormioDataViewerMode[keyof typeof FormioDataViewerMode];

export const FormioDataViewModeDisplayText: Record<FormioDataViewerMode, string> = {
	json: 'JSON',
	yaml: 'YAML',
};

export function FormioDataViewer({ data }: { data: object }) {
	const [selectedMode, setSelectedMode] = useState<FormioDataViewerMode>(
		FormioDataViewerMode.yaml,
	);

	function handleModeRadioChange(event: ChangeEvent<HTMLInputElement>): void {
		setSelectedMode(event.target.value as FormioDataViewerMode);
	}

	const value = useMemo(
		() =>
			selectedMode === FormioDataViewerMode.yaml
				? YAML.stringify(data)
				: JSON.stringify(data, undefined, '\t') + '\n',
		[data, selectedMode],
	);

	return (
		<Stack>
			<Form>
				{Object.values(FormioDataViewerMode).map((mode) => (
					<FormGroup check inline key={mode}>
						<Input
							defaultChecked={selectedMode === mode}
							id={`mode-radio-${mode}`}
							name="mode"
							onChange={handleModeRadioChange}
							type="radio"
							value={mode}
						/>
						<Label check for={`mode-radio-${mode}`}>
							{FormioDataViewModeDisplayText[mode]}
						</Label>
					</FormGroup>
				))}
			</Form>
			<TextEditor mode={selectedMode} value={value} />
		</Stack>
	);
}
