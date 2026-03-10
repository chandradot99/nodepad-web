import client from './client'
import type { Workflow } from '../types'

export const workflowsApi = {
  list: (connectionId: string) =>
    client.get<Workflow[]>(`/connections/${connectionId}/workflows`).then(r => r.data),

  get: (id: string) =>
    client.get<Workflow>(`/workflows/${id}`).then(r => r.data),
}
