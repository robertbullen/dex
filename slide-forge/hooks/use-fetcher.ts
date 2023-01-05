import { useEffect, useState } from 'react';

export interface UseFetcherState<T> {
	data: T | undefined;
	error: Error | undefined;
	isBusy: boolean;
	isTriggered: boolean;
	trigger(handleCompleted?: (data: T) => void): void;
}

export function useFetcher<T>(
	fetcher: () => Promise<T>,
	options: {
		handleCompleted?: (data: T) => void;
		isTriggered?: boolean;
		initialData?: T;
	} = {},
): UseFetcherState<T> {
	let handleCompleted = options.handleCompleted;
	const isTriggered = options.isTriggered ?? true;
	const initialData = options.initialData;

	const [state, setState] = useState<UseFetcherState<T>>({
		data: initialData,
		error: undefined as Error | undefined,
		isBusy: false,
		isTriggered,
		trigger(newHandleCompleted: ((data: T) => void) | undefined = handleCompleted): void {
			handleCompleted = newHandleCompleted;
			setState((oldState) => ({
				...oldState,
				isTriggered: true,
			}));
		},
	});

	useEffect(() => {
		// This variable tracks whether the host component has been unmounted in order to avoid
		// fetching data twice due to [React 18's strict mode](https://reactjs.org/docs/strict-mode.html#ensuring-reusable-state).
		let destroyed = false;
		let timeoutHandle = undefined as ReturnType<typeof setTimeout> | undefined;

		if (state.isTriggered) {
			async function doFetch() {
				setState((oldState) => ({
					...oldState,
					data: initialData,
					error: undefined,
					isBusy: true,
				}));

				try {
					// Don't bother starting a fetch if the component was already unmounted.
					if (destroyed) return;

					const data = await fetcher();

					// If the component has unmounted since the fetch was initiated, don't bother
					// updating state because there may be a newer request in progress.
					if (destroyed) return;

					setState((oldState) => ({
						...oldState,
						data,
						error: undefined,
						isBusy: false,
					}));

					handleCompleted?.(data);
				} catch (error) {
					setState((oldState) => ({
						...oldState,
						data: undefined,
						error: error instanceof Error ? error : new Error(`${error}`),
						isBusy: false,
					}));
				}
			}

			// Invoking the worker function on the next tick reduces the likelihood of a double
			// invocation in strict mode.
			timeoutHandle = setTimeout(doFetch, 0);
		}

		return () => {
			destroyed = true;
			clearTimeout(timeoutHandle);
		};
	}, [fetcher, handleCompleted, initialData, state.isTriggered]);

	return state;
}
