import Head from 'next/head';
import { PropsWithChildren } from 'react';
import { Footer } from './footer';
import { Header } from './header';
import { Main } from './main';

export function Layout({ children }: PropsWithChildren) {
	return (
		<>
			<Head>
				<title>SlideForge</title>
				<meta name="description" content="PowerPoint slide deck templates and generation" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<link rel="icon" href="/favicon.ico" />
			</Head>
			<Header />
			<Main>{children}</Main>
			<Footer />
		</>
	);
}
