import { PropsWithChildren } from 'react';
import { Container } from 'reactstrap';

export function Main({ children }: PropsWithChildren) {
	return (
		<main className="my-5">
			<Container>{children}</Container>
		</main>
	);
}
