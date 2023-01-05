import { Modal, ModalBody, Spinner } from 'reactstrap';

export function BusyOverlay() {
	return (
		<Modal backdrop="static" className="busy-overlay h-100 my-0" fade={false} isOpen={true}>
			<ModalBody className="align-items-center d-flex justify-content-center">
				<Spinner color="light" style={{ height: '5rem', width: '5rem' }}>
					Busy...
				</Spinner>
			</ModalBody>
		</Modal>
	);
}
