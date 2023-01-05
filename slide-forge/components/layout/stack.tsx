import { Children, PropsWithChildren } from 'react';

type Props = PropsWithChildren<{
	size?: 'sm' | 'lg';
}>;

export function Stack({ children, size }: Props) {
	let className = 'stack';
	if (size) {
		className += ` stack-${size}`;
	}

	const array = Children.toArray(children);

	return (
		<div className={className}>
			{Children.map(array, (child, childIndex) => (
				<div className="stack-item" key={childIndex}>
					{child}
				</div>
			))}
		</div>
	);
}
