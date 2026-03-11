import client from './client'

export const extensionApi = {
  status: () =>
    client.get<{ has_token: boolean; hint: string | null }>('/extension-token/status').then(r => r.data),

  generate: () =>
    client.post<{ token: string }>('/extension-token').then(r => r.data),

  revoke: () =>
    client.delete('/extension-token'),
}
