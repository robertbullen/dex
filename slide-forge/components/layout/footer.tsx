import { Navbar, NavbarText } from 'reactstrap';

export function Footer() {
	return (
		<footer style={{ fontSize: 'smaller' }}>
			<Navbar color="dark" dark container>
				<NavbarText>Copyright © {new Date().getFullYear()}</NavbarText>
			</Navbar>
		</footer>
	);
}
