import { PropsWithChildren } from 'react';
import { Container } from 'reactstrap';

export function Main({ children }: PropsWithChildren) {
	return (
		<main className="my-4">
			<Container>{children}</Container>
		</main>
	);
}
