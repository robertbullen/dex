import { useEffect } from 'react';
import { FormioForm } from '../../data/formio';

export interface FormioDataChangedEvent {
	data: object;
	isDataValid: boolean;
	type: 'data-changed';
}

export interface FormioDataSubmittedEvent {
	data: object;
	type: 'data-submitted';
}

export interface FormioFormChangedEvent {
	form: FormioForm;
	type: 'form-changed';
}

export type FormioHostEvent =
	| FormioDataChangedEvent
	| FormioDataSubmittedEvent
	| FormioFormChangedEvent;

export function FormioHost({
	mode,
	handleEvent,
	queryParams,
}: {
	mode: 'builder' | 'renderer';
	handleEvent(event: FormioHostEvent): void;
	queryParams?: Record<string, string>;
}) {
	useEffect(() => {
		function handleMessage(event: MessageEvent) {
			handleEvent(event.data);
		}

		window.addEventListener('message', handleMessage);
		return () => window.removeEventListener('message', handleMessage);
	}, [handleEvent]);

	const newQueryParams: Record<string, string> = {
		...queryParams,
		mode,
		log: 'true',
	};
	const fullUrl = `/formio-host.html?${new URLSearchParams(newQueryParams)}`;

	return <iframe height={1000} src={fullUrl.toString()} width="100%" />;
}
