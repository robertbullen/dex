export function simulateLatency<T extends object>(
	service: T,
	minLatencyMilliseconds: number = 100,
	maxLatencyMilliseconds: number = 2000,
): T {
	return new Proxy<T>(service, {
		get(target: T, p: string | symbol, receiver: any): any {
			let result = (target as any)[p];
			if (typeof result === 'function') {
				const oldMethod = result;

				const newMethod = (...args: unknown[]): unknown => {
					const latencyMilliseconds: number = Math.round(
						Math.random() ** 2 * (maxLatencyMilliseconds - minLatencyMilliseconds) +
							minLatencyMilliseconds,
					);
					return new Promise((resolve) =>
						setTimeout(
							() => resolve(Reflect.apply(oldMethod, target, args)),
							latencyMilliseconds,
						),
					);
				};

				result = newMethod;
			}
			return result;
		},
	});
}
