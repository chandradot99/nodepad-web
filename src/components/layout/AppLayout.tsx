import Sidebar from './Sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen flex bg-bg text-text overflow-hidden">
      <Sidebar />
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  )
}
