import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg)' }}>
      <main className="flex-1 has-bottom-nav">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
