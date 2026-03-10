import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { workspacesApi } from '../api/workspaces'
import type { Workspace } from '../types'

export default function DashboardPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [showModal, setShowModal] = useState(false)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    workspacesApi.list()
      .then(setWorkspaces)
      .finally(() => setFetching(false))
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const workspace = await workspacesApi.create(name)
      setWorkspaces(prev => [...prev, workspace])
      setShowModal(false)
      setName('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Workspaces</h1>
            <p className="text-gray-400 text-sm mt-1">Each workspace connects to one n8n instance</p>
          </div>
          <Button onClick={() => setShowModal(true)}>+ New Workspace</Button>
        </div>

        {fetching ? (
          <p className="text-gray-400">Loading...</p>
        ) : workspaces.length === 0 ? (
          <div className="border border-dashed border-gray-700 rounded-xl p-12 text-center">
            <p className="text-gray-400 mb-4">No workspaces yet</p>
            <Button onClick={() => setShowModal(true)}>Create your first workspace</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {workspaces.map(ws => (
              <div
                key={ws.id}
                onClick={() => navigate(`/workspaces/${ws.id}`)}
                className="bg-gray-900 border border-gray-800 rounded-xl p-5 cursor-pointer hover:border-gray-600 transition-colors"
              >
                <h3 className="font-semibold text-white">{ws.name}</h3>
                <p className="text-gray-500 text-xs mt-2">Click to manage connections</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <Modal title="New Workspace" onClose={() => setShowModal(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <Input
              label="Workspace name"
              placeholder="e.g. My Company"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
            <div className="flex justify-end gap-3">
              <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button type="submit" loading={loading}>Create</Button>
            </div>
          </form>
        </Modal>
      )}
    </AppLayout>
  )
}
