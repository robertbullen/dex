import { useRouter } from 'next/router';
import { useCallback } from 'react';
import { Page } from '../../components/layout/page';
import { TemplateList } from '../../components/templates/template-list';
import { templatesService } from '../../data/templates/service';
import { TemplateResponse } from '../../data/templates/templates';
import { useFetcher } from '../../hooks/use-fetcher';

export default function TemplatesListPage() {
	const router = useRouter();
	const readAllTemplates = useCallback(() => templatesService.readAll(), []);
	const { data: templates, error, isBusy } = useFetcher(readAllTemplates);

	function handleTemplateClick(template: TemplateResponse): void {
		router.push(`templates/${template.id}`);
	}

	return (
		<Page error={error} isBusy={isBusy} title="Templates">
			<TemplateList handleTemplateClick={handleTemplateClick} templates={templates ?? []} />
		</Page>
	);
}
