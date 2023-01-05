import 'bootstrap/dist/css/bootstrap.min.css';
import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { Layout } from '../components/layout/layout';
import '../styles/index.css';

export default function App({ Component, pageProps }: AppProps) {
	useEffect(() => void require('bootstrap/dist/js/bootstrap.bundle.min.js'), []);

	return (
		<Layout>
			<Component {...pageProps} />
		</Layout>
	);
}
