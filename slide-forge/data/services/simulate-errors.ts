export function simulateErrors<T extends object>(
	service: T,
	errorProbability: number = 0.1,
	createError: () => Error = () => new Error('Simulated error'),
): T {
	return new Proxy<T>(service, {
		get(target: T, p: string | symbol, receiver: any): any {
			let result = (target as any)[p];
			if (typeof result === 'function' && Math.random() < errorProbability) {
				result = () => {
					throw createError();
				};
			}
			return result;
		},
	});
}
