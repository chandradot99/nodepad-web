import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Workspace } from '../types'

interface WorkspaceStore {
  workspaces: Workspace[]
  currentId: string | null
  setWorkspaces: (ws: Workspace[]) => void
  setCurrentId: (id: string) => void
  addWorkspace: (ws: Workspace) => void
}

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set) => ({
      workspaces: [],
      currentId: null,
      setWorkspaces: (workspaces) => set({ workspaces }),
      setCurrentId: (currentId) => set({ currentId }),
      addWorkspace: (ws) =>
        set((state) => ({
          workspaces: [...state.workspaces, ws],
          // Auto-select if it's the first workspace
          currentId: state.currentId ?? ws.id,
        })),
    }),
    { name: 'nodepad-workspace', partialize: (s) => ({ currentId: s.currentId }) }
  )
)
