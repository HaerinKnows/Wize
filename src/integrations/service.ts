import { IntegrationState } from '@/types/domain';

export type Provider = 'GCash' | 'Paytm' | 'Ovo';

export const integrationsService = {
  async connect(provider: Provider): Promise<{ provider: Provider; status: IntegrationState; lastSync: string }> {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return { provider, status: 'connected', lastSync: new Date().toISOString() };
  }
};
