import { Children, PropsWithChildren, useState } from 'react';
import { Nav, NavItem, NavLink, TabContent, TabPane } from 'reactstrap';

type Props = PropsWithChildren<{ initialActiveTab?: number; titles: readonly string[] }>;

export function Tabs({ initialActiveTab, children, titles }: Props) {
	const [activeTab, setActiveTab] = useState(initialActiveTab ?? 0);

	const childArray = Children.toArray(children);

	return (
		<div>
			<Nav tabs>
				{titles.map((title, titleIndex) => (
					<NavItem key={titleIndex}>
						<NavLink
							active={titleIndex === activeTab}
							onClick={() => setActiveTab(titleIndex)}
						>
							{title}
						</NavLink>
					</NavItem>
				))}
			</Nav>

			<TabContent activeTab={activeTab} className="border-bottom border-end border-start p-3">
				{Children.map(childArray, (child, childIndex) => (
					<TabPane key={childIndex} tabId={childIndex}>
						{child}
					</TabPane>
				))}
			</TabContent>
		</div>
	);
}
