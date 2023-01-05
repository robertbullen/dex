import { logInvocations } from '../services/log-invocations';
import { simulateErrors } from '../services/simulate-errors';
import { simulateLatency } from '../services/simulate-latency';
import { MockTemplatesService } from './mock-templates-service';

// TODO: Use context for services.
export const templatesService = logInvocations(
	simulateLatency(simulateErrors(new MockTemplatesService())),
);
// export const templatesService = new MockTemplatesService();
