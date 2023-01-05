import { Button, ButtonToolbar } from 'reactstrap';

export function CancelSaveBar({
	handleCancel,
	handleSave,
	isSaveEnabled,
	isSaveVisible = true,
	saveButtonText = 'Save',
}: {
	handleCancel(): void;
	handleSave(): void;
	isSaveEnabled: boolean;
	isSaveVisible?: boolean;
	saveButtonText?: string;
}) {
	return (
		<ButtonToolbar>
			<Button className="me-auto" color="secondary" onClick={handleCancel} size="lg">
				Cancel
			</Button>
			{isSaveVisible && (
				<Button
					className="ms-auto"
					color="primary"
					disabled={!isSaveEnabled}
					onClick={handleSave}
					size="lg"
				>
					{saveButtonText}
				</Button>
			)}
		</ButtonToolbar>
	);
}
