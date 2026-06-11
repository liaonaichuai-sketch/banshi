import { useLocation, useNavigate } from 'react-router-dom'

const NAV_ITEMS = [
  { path: '/', label: '首页', icon: '🏠' },
  { path: '/new', label: '捞石头', icon: '⛏️' },
  { path: '/stones', label: '石头', icon: '🪨' },
  { path: '/riverbed', label: '河床', icon: '📊' },
  { path: '/collections', label: '收藏', icon: '⭐' },
]

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  // 捞石头流程中隐藏底部导航（沉浸式体验）
  if (location.pathname === '/new') return null

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t flex justify-around items-center"
      style={{
        background: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
        height: 64,
        paddingBottom: 'env(safe-area-inset-bottom, 0)',
      }}
    >
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.path)

        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="flex flex-col items-center justify-center gap-0.5 w-16 py-1 transition-colors"
            style={{
              color: isActive ? 'var(--color-text)' : 'var(--color-text-muted)',
            }}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-xs">{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
