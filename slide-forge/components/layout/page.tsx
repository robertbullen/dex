import { PropsWithChildren } from 'react';
import { Alert } from 'reactstrap';
import { BusyOverlay } from './busy-overlay';

export function Page({
	children,
	error,
	isBusy = false,
	title,
}: PropsWithChildren<{
	error?: unknown;
	isBusy?: boolean;
	title: string;
}>) {
	return (
		<>
			{isBusy && <BusyOverlay />}
			<h1 className="border-bottom display-6 mb-4 text-muted">{title}</h1>
			{error && <Alert color="danger">{`${error}`}</Alert>}
			{children}
		</>
	);
}
