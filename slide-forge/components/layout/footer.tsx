import { Navbar, NavbarText } from 'reactstrap';

export function Footer() {
	return (
		<footer>
			<Navbar color="dark" dark container>
				<NavbarText>Copyright © 2022-{new Date().getFullYear()}</NavbarText>
			</Navbar>
		</footer>
	);
}
