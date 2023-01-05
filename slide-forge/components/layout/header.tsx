import Link from 'next/link';
import { NextRouter, useRouter } from 'next/router';
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
	const router: NextRouter = useRouter();

	return (
		<header>
			<Navbar color="dark" container dark expand="md">
				<NavbarBrand href="/" tag={Link}>
					Slide Forge
				</NavbarBrand>
				<NavbarToggler id="toggler" />
				<UncontrolledCollapse navbar toggler="#toggler">
					<Nav navbar>
						<NavItem>
							<NavLink
								active={router.pathname.startsWith('/templates')}
								href="/templates"
								tag={Link}
							>
								Templates
							</NavLink>
						</NavItem>
						<NavItem>
							<NavLink
								active={router.pathname.startsWith('/slide-decks')}
								href="/slide-decks"
								tag={Link}
							>
								Slide Decks
							</NavLink>
						</NavItem>
					</Nav>
				</UncontrolledCollapse>
			</Navbar>
		</header>
	);
}
