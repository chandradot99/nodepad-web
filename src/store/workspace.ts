import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Workspace, Connection } from '../types'
import { connectionsApi } from '../api/connections'

interface WorkspaceStore {
  workspaces: Workspace[]
  currentId: string | null
  currentConnection: Connection | null
  setWorkspaces: (ws: Workspace[]) => void
  setCurrentId: (id: string) => void
  addWorkspace: (ws: Workspace) => void
  setCurrentConnection: (conn: Connection | null) => void
  loadConnection: (workspaceId: string) => Promise<void>
}

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set) => ({
      workspaces: [],
      currentId: null,
      currentConnection: null,

      setWorkspaces: (workspaces) => set({ workspaces }),

      setCurrentId: (currentId) => set({ currentId, currentConnection: null }),

      addWorkspace: (ws) =>
        set((state) => ({
          workspaces: [...state.workspaces, ws],
          currentId: state.currentId ?? ws.id,
        })),

      setCurrentConnection: (currentConnection) => set({ currentConnection }),

      loadConnection: async (workspaceId) => {
        const conns = await connectionsApi.list(workspaceId)
        set({ currentConnection: conns[0] ?? null })
      },
    }),
    {
      name: 'nodepad-workspace',
      partialize: (s) => ({ currentId: s.currentId }),
    }
  )
)
