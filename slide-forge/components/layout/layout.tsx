import { PropsWithChildren } from 'react';
import { Footer } from './footer';
import { Header } from './header';
import { Main } from './main';

export function Layout({ children }: PropsWithChildren) {
	return (
		<>
			<Header />
			<Main>{children}</Main>
			<Footer />
		</>
	);
}
