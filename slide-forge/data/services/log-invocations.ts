export function logInvocations<T extends object>(service: T): T {
	return new Proxy<T>(service, {
		get(target: T, p: string | symbol, receiver: any): any {
			let result = (target as any)[p];
			if (typeof result === 'function') {
				console.info(
					`${Object.getPrototypeOf(service).constructor.name}.${p.toString()}`,
					typeof window,
				);
			}
			return result;
		},
	});
}
