import { useRouter } from 'next/router';
import { useCallback, useState } from 'react';
import { Page } from '../../../components/layout/page';
import { TemplateDetail } from '../../../components/templates/template-detail';
import { templatesService } from '../../../data/templates/service';
import { Template, TemplateRequest } from '../../../data/templates/templates';
import { useFetcher } from '../../../hooks/use-fetcher';

export default function TemplateDetailPage() {
	const router = useRouter();

	const { templateId } = router.query;
	if (typeof templateId !== 'string') throw new Error();

	type Phase = 'read-template' | 'create-or-update-template';
	const [phase, setPhase] = useState<Phase>('read-template');

	const readTemplate = useCallback(() => templatesService.read(templateId), [templateId]);
	const readTemplateFetcherState = useFetcher(readTemplate);

	const createOrUpdateTemplate = useCallback(() => {
		if (!readTemplateFetcherState.data) throw new Error(`Undefined template`);
		return templatesService.createOrUpdate(readTemplateFetcherState.data);
	}, [readTemplateFetcherState.data]);
	const createOrUpdateTemplateFetcherState = useFetcher(createOrUpdateTemplate, {
		initialData: readTemplateFetcherState.data,
		isTriggered: false,
	});

	const fetcherState =
		phase === 'create-or-update-template'
			? createOrUpdateTemplateFetcherState
			: readTemplateFetcherState;
	console.info({ readTemplateFetcherState, createOrUpdateTemplateFetcherState, fetcherState });

	function handleCancel(): void {
		router.back();
	}

	async function handleSave(template: Template): Promise<void> {
		setPhase('create-or-update-template');
		createOrUpdateTemplateFetcherState.trigger(() => router.back());
	}

	return (
		<Page error={fetcherState.error} isBusy={fetcherState.isBusy} title="Template Details">
			<TemplateDetail
				handleCancel={handleCancel}
				handleFormAction={(action) => router.push(`/templates/${templateId}/form-editor`)}
				handleSave={handleSave}
				handleSlidesAction={() => undefined}
				initialTemplate={fetcherState.data ?? TemplateRequest.empty()}
				mode="edit"
			/>
		</Page>
	);
}
