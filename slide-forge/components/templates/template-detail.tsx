import { ChangeEvent, useState } from 'react';
import {
	Button,
	ButtonGroup,
	Card,
	CardBody,
	CardImg,
	CardTitle,
	Col,
	Form,
	FormGroup,
	Input,
	Label,
	Row,
} from 'reactstrap';
import { Template } from '../../data/templates/templates';
import { FormioEditorAction } from '../formio/formio-editor';
import { CancelSaveBar } from '../layout/cancel-save-bar';
import { Stack } from '../layout/stack';

export function TemplateDetail({
	handleCancel,
	handleFormAction,
	handleSave,
	handleSlidesAction,
	initialTemplate,
	mode,
}: {
	handleCancel(): void;
	handleFormAction(action: FormioEditorAction): void;
	handleSave(template: Template): void;
	handleSlidesAction(action: 'download' | 'upload'): void;
	initialTemplate: Readonly<Template>;
	mode: 'create' | 'edit' | 'view';
}) {
	const [template, setTemplate] = useState(initialTemplate);
	if (initialTemplate !== template) {
		setTemplate(initialTemplate);
	}

	const isReadonly: boolean = mode === 'view';

	function handleInputChange(event: ChangeEvent<HTMLInputElement>, key: keyof Template): void {
		setTemplate(
			(oldTemplate: Template): Template => ({
				...oldTemplate,
				[key]: event.target.value,
			}),
		);
	}

	return (
		<Stack>
			<CancelSaveBar
				handleCancel={handleCancel}
				handleSave={() => handleSave(template)}
				isSaveEnabled={template !== initialTemplate}
				isSaveVisible={mode === 'create' || mode === 'edit'}
				saveButtonText={mode === 'create' ? 'Create' : undefined}
			/>

			<Form onSubmit={(event) => event.preventDefault()}>
				<FormGroup disabled={isReadonly} tag="fieldset">
					<FormGroup>
						<Label for="nameInput">Name</Label>
						<Input
							id="nameInput"
							name="name"
							onChange={(event) => handleInputChange(event, 'name')}
							required
							type="text"
							value={template.name}
						/>
					</FormGroup>

					<FormGroup>
						<Label for="descriptionInput">Description</Label>
						<Input
							id="descriptionInput"
							name="description"
							onChange={(event) => handleInputChange(event, 'description')}
							required
							type="textarea"
							value={template.description}
						/>
					</FormGroup>

					<div className="d-inline-block">
						<Row>
							<Col>
								<Card className="h-100">
									<CardImg
										alt="Slide Deck Thumbnail"
										className="border-bottom"
										src="/powerpoint-thumbnail.jpg"
										top
									/>
									<CardBody>
										<CardTitle tag="h6">PowerPoint Template</CardTitle>
										<ButtonGroup className="w-100" size="sm" vertical>
											<Button
												color="primary"
												onClick={() => handleSlidesAction('download')}
												outline
											>
												Download Current
											</Button>
											{!isReadonly && (
												<Button
													color="primary"
													onClick={() => handleSlidesAction('upload')}
													outline
												>
													Upload Updated
												</Button>
											)}
										</ButtonGroup>
									</CardBody>
								</Card>
							</Col>
							<Col>
								<Card className="h-100">
									<CardImg
										alt="Form Thumbnail"
										className="border-bottom"
										src="/form-thumbnail.jpg"
										top
									/>
									<CardBody>
										<CardTitle tag="h6">Data Entry Form</CardTitle>
										<ButtonGroup className="w-100" size="sm" vertical>
											{!isReadonly && (
												<Button
													color="primary"
													onClick={() =>
														handleFormAction(
															FormioEditorAction.designInBuilder,
														)
													}
													outline
												>
													Design
												</Button>
											)}
											<Button
												color="primary"
												onClick={() =>
													handleFormAction(
														FormioEditorAction.previewDataEntry,
													)
												}
												outline
											>
												Preview
											</Button>
											<Button
												color="primary"
												onClick={() =>
													handleFormAction(
														FormioEditorAction.viewSampleData,
													)
												}
												outline
											>
												View Data
											</Button>
										</ButtonGroup>
									</CardBody>
								</Card>
							</Col>
						</Row>
					</div>
				</FormGroup>
			</Form>
		</Stack>
	);
}
