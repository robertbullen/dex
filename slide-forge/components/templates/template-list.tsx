import { FormEvent, useMemo, useState } from 'react';
import {
	Button,
	ButtonGroup,
	FormFeedback,
	Input,
	InputGroup,
	Pagination,
	PaginationItem,
	PaginationLink,
	Table,
} from 'reactstrap';
import { TemplateResponse } from '../../data/templates/templates';
import { TemplatesService } from '../../data/templates/templates-service';
import { Stack } from '../layout/stack';

export function TemplateList({
	handleTemplateClick,
	templates,
}: {
	handleTemplateClick(template: TemplateResponse): void;
	templates: readonly TemplateResponse[];
}) {
	const [searchPattern, setSearchPattern] = useState('');
	const [searchPatternErrorMessage, setSearchPatternErrorMessage] = useState<string>();

	const displayedTemplates = useMemo((): TemplateResponse[] => {
		const searchRegex = ((): RegExp => {
			let regex: RegExp;
			try {
				regex = new RegExp(searchPattern, 'i');
				setSearchPatternErrorMessage(undefined);
			} catch (error) {
				if (!(error instanceof SyntaxError)) {
					throw error;
				} else {
					regex = /[^]*/;
					setSearchPatternErrorMessage(error.message);
				}
			}
			return regex;
		})();

		const filteredTemplates: readonly TemplateResponse[] =
			templates && searchPattern
				? TemplatesService.search(templates, searchRegex)
				: templates ?? [];

		const sortedTemplates: TemplateResponse[] = TemplatesService.sort(filteredTemplates);

		return sortedTemplates;
	}, [templates, searchPattern]);

	function handleCreateClick(): void {
		window.alert('TODO');
	}

	function handleSearchClear(): void {
		setSearchPattern('');
	}

	function handleSearchInput(event: FormEvent<HTMLInputElement>): void {
		setSearchPattern((event.target as HTMLInputElement).value);
	}

	return (
		<Stack size="sm">
			<div className="align-items-center d-flex flex-nowrap pt-1 px-1">
				<InputGroup className="flex-grow-1 me-4">
					<Input
						placeholder="Search in Name or Description"
						type="text"
						value={searchPattern}
						onInput={handleSearchInput}
						invalid={!!searchPatternErrorMessage}
					/>
					<FormFeedback tooltip>{searchPatternErrorMessage}</FormFeedback>
					<Button
						className="text-nowrap"
						disabled={!searchPattern}
						onClick={handleSearchClear}
						outline={!searchPattern}
					>
						×
					</Button>
				</InputGroup>

				<Pagination className="me-4">
					<PaginationItem disabled>
						<PaginationLink first href="#" />
					</PaginationItem>
					<PaginationItem disabled>
						<PaginationLink href="#" previous />
					</PaginationItem>
					<PaginationItem active>
						<PaginationLink href="#">1</PaginationLink>
					</PaginationItem>
					<PaginationItem>
						<PaginationLink href="#">2</PaginationLink>
					</PaginationItem>
					<PaginationItem disabled>
						<PaginationLink href="#">3</PaginationLink>
					</PaginationItem>
					<PaginationItem>
						<PaginationLink href="#" next />
					</PaginationItem>
					<PaginationItem>
						<PaginationLink href="#" last />
					</PaginationItem>
				</Pagination>

				<Button color="primary" onClick={handleCreateClick}>
					Create
				</Button>
			</div>

			<Table hover size="sm">
				<thead>
					<tr>
						<th>Name</th>
						<th>Description</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody className="placeholder-wave">
					{displayedTemplates.length > 0 ? (
						displayedTemplates.map((template: TemplateResponse) => (
							<tr key={template.id}>
								<td
									className="align-middle cursor-pointer"
									onClick={() => handleTemplateClick(template)}
								>
									{template.name}
								</td>
								<td
									className="align-middle cursor-pointer"
									onClick={() => handleTemplateClick(template)}
								>
									{template.description}
								</td>
								<td className="">
									<ButtonGroup>
										<Button color="link" disabled>
											Clone
										</Button>
										<Button color="link" disabled>
											Delete
										</Button>
									</ButtonGroup>
								</td>
							</tr>
						))
					) : (
						<tr>
							<td className="text-center" colSpan={3}>
								No results to display
							</td>
						</tr>
					)}
				</tbody>
			</Table>
		</Stack>
	);
}
