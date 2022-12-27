import {
	Nav,
	Navbar,
	NavbarBrand,
	NavbarToggler,
	NavItem,
	NavLink,
	UncontrolledCollapse,
} from 'reactstrap';

export function Header() {
	return (
		<header>
			<Navbar color="dark" container dark expand="md">
				<NavbarBrand href="/">SlideForge</NavbarBrand>
				<NavbarToggler id="toggler" />
				<UncontrolledCollapse navbar toggler="#toggler">
					<Nav navbar>
						<NavItem>
							<NavLink href="/templates/">Templates</NavLink>
						</NavItem>
						<NavItem>
							<NavLink href="/decks/">Slide Decks</NavLink>
						</NavItem>
					</Nav>
				</UncontrolledCollapse>
			</Navbar>
		</header>
	);
}
