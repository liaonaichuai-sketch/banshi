import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useStones } from '../hooks/useStones'
import { useQuickNotes } from '../hooks/useQuickNotes'

export default function Home() {
  const { user, signOut } = useAuth()
  const { total, fetchStones } = useStones(user?.id)
  const { notes, fetchNotes, createNote, deleteNote } = useQuickNotes(user?.id)

  const [quickText, setQuickText] = useState('')
  const [showQuickInput, setShowQuickInput] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (user?.id) {
      fetchStones({ search: '', timeRange: 'all', coreStones: [], tags: [], sort: 'newest' }, 0)
      fetchNotes()
    }
  }, [user?.id, fetchStones, fetchNotes])

  const handleQuickSave = async () => {
    if (!quickText.trim()) return
    await createNote(quickText.trim())
    setQuickText('')
    setShowQuickInput(false)
  }

  const handleConvertNote = (noteId: string) => {
    // 存 noteId 到 sessionStorage，捞石头流程结束后关联
    sessionStorage.setItem('convert_note_id', noteId)
    navigate('/new')
  }

  const unrevertedNotes = notes.filter((n) => !n.is_converted)

  return (
    <div className="page-container py-8">
      {/* 顶部 */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">搬石上山</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {user?.nickname || user?.email?.split('@')[0]} ·{' '}
            <button onClick={signOut} className="underline" style={{ color: 'var(--color-text-muted)' }}>
              退出
            </button>
          </p>
        </div>
      </div>

      {/* 石头计数 */}
      <div className="card text-center py-10 mb-8">
        <p className="text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
          时至今日 我已经捞出
        </p>
        <p className="text-6xl font-light tracking-tight mb-2">{total}</p>
        <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>
          块石头
        </p>
      </div>

      {/* 四大入口 */}
      <div className="space-y-3 mb-8">
        <button
          onClick={() => navigate('/new')}
          className="btn btn-primary btn-block text-lg py-4"
        >
          ⛏️ 开始捞石头
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/stones')}
            className="btn btn-secondary py-4"
          >
            📜 以前的石头
          </button>
          <button
            onClick={() => navigate('/riverbed')}
            className="btn btn-secondary py-4"
          >
            📊 查看河床
          </button>
        </div>

        <button
          onClick={() => navigate('/collections')}
          className="btn btn-secondary btn-block py-4"
        >
          ⭐ 我的收藏
        </button>

        <button
          onClick={() => navigate('/settings')}
          className="btn btn-secondary btn-block py-3 text-sm"
          style={{ border: 'none' }}
        >
          ⚙️ 设置
        </button>
      </div>

      {/* 快速记录 */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium">快速记录</h3>
          <button
            onClick={() => setShowQuickInput(!showQuickInput)}
            className="text-sm underline"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {showQuickInput ? '收起' : '记一笔'}
          </button>
        </div>

        {showQuickInput && (
          <div className="mb-3">
            <textarea
              value={quickText}
              onChange={(e) => setQuickText(e.target.value)}
              placeholder="此刻脑子里的一句话..."
              className="mb-2"
              style={{ minHeight: 80 }}
              autoFocus
            />
            <button onClick={handleQuickSave} className="btn btn-primary btn-sm" disabled={!quickText.trim()}>
              保存
            </button>
          </div>
        )}

        {unrevertedNotes.length > 0 && (
          <div className="space-y-3 mt-3">
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              未转换的记录（{unrevertedNotes.length}条）
            </p>
            {unrevertedNotes.slice(0, 3).map((note) => (
              <div
                key={note.id}
                className="p-3 rounded-lg border"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <p className="text-sm mb-2">{note.content}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleConvertNote(note.id)}
                    className="btn btn-primary btn-sm"
                  >
                    展开为完整石头
                  </button>
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="btn btn-secondary btn-sm"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
            {unrevertedNotes.length > 3 && (
              <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
                还有 {unrevertedNotes.length - 3} 条未显示
              </p>
            )}
          </div>
        )}

        {!showQuickInput && unrevertedNotes.length === 0 && (
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            记录一瞬间的念头，回头再慢慢捞
          </p>
        )}
      </div>
    </div>
  )
}
