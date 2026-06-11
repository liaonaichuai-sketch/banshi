import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useStones } from '../hooks/useStones'
import { useQuickNotes } from '../hooks/useQuickNotes'
import { STONE_STEPS, type StoneDraft } from '../types'

const EMPTY_DRAFT: StoneDraft = {
  layer_1_fact: '',
  layer_2_reaction: '',
  layer_3_want: '',
  layer_4_fear: '',
  layer_5_rationalization: '',
  layer_6_core_stone: '',
  current_step: 0,
}

export default function NewStone() {
  const { user } = useAuth()
  const { createStone, getCoreStones } = useStones(user?.id)
  const { convertToStone } = useQuickNotes(user?.id)
  const navigate = useNavigate()

  const [draft, setDraft] = useState<StoneDraft>(() => {
    const saved = localStorage.getItem('stone_draft')
    return saved ? JSON.parse(saved) : { ...EMPTY_DRAFT }
  })

  const [saving, setSaving] = useState(false)
  const [existingStones, setExistingStones] = useState<string[]>([])

  const step = STONE_STEPS[draft.current_step]

  // 加载已有主石头列表（第六步时用）
  useEffect(() => {
    if (draft.current_step === 5 && user?.id) {
      getCoreStones().then((list) => setExistingStones(list.map((s) => s.name)))
    }
  }, [draft.current_step, user?.id, getCoreStones])

  // 每次 draft 变化就存 localStorage
  useEffect(() => {
    localStorage.setItem('stone_draft', JSON.stringify(draft))
  }, [draft])

  const setField = (value: string) => {
    setDraft((prev) => ({ ...prev, [step.key]: value }))
  }

  const goNext = () => {
    if (draft.current_step < 5) {
      setDraft((prev) => ({ ...prev, current_step: prev.current_step + 1 }))
    }
  }

  const goPrev = () => {
    if (draft.current_step > 0) {
      setDraft((prev) => ({ ...prev, current_step: prev.current_step - 1 }))
    }
  }

  const handleSave = async () => {
    if (!draft.layer_6_core_stone.trim()) return

    setSaving(true)
    try {
      const stone = await createStone({
        layer_1_fact: draft.layer_1_fact,
        layer_2_reaction: draft.layer_2_reaction,
        layer_3_want: draft.layer_3_want,
        layer_4_fear: draft.layer_4_fear,
        layer_5_rationalization: draft.layer_5_rationalization,
        layer_6_core_stone: draft.layer_6_core_stone,
        tags: [],
        mood_score: null,
        source: 'full_flow',
      })

      // 如果是从快速记录转换来的，关联
      const noteId = sessionStorage.getItem('convert_note_id')
      if (noteId && stone) {
        await convertToStone(noteId, stone.id)
        sessionStorage.removeItem('convert_note_id')
      }

      // 清除草稿
      localStorage.removeItem('stone_draft')
      navigate('/')
    } catch (e) {
      console.error('保存失败', e)
    } finally {
      setSaving(false)
    }
  }

  const progressPct = Math.round(((draft.current_step + 1) / 6) * 100)

  return (
    <div className="page-container py-6">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate('/')} className="text-sm underline" style={{ color: 'var(--color-text-muted)' }}>
          ← 返回
        </button>
        <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          步骤 {draft.current_step + 1}/6
        </span>
      </div>

      {/* 进度条 */}
      <div className="w-full h-1 rounded-full mb-8" style={{ background: 'var(--color-border)' }}>
        <div
          className="h-1 rounded-full transition-all duration-300"
          style={{ width: `${progressPct}%`, background: 'var(--color-accent)' }}
        />
      </div>

      {/* 步骤内容 */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">{step.title}</h2>
        <p className="mb-6" style={{ color: 'var(--color-text-secondary)' }}>
          {step.hint}
        </p>

        <textarea
          value={draft[step.key]}
          onChange={(e) => setField(e.target.value)}
          placeholder={step.placeholder}
          className="w-full"
          style={{ minHeight: 180, fontSize: 16 }}
          autoFocus
        />

        {/* 第六步：显示已有的类似石头 */}
        {draft.current_step === 5 && existingStones.length > 0 && draft.layer_6_core_stone && (
          <div className="mt-4 p-3 rounded-lg border" style={{ borderColor: 'var(--color-border)' }}>
            <p className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>
              你以前捞过类似的石头：
            </p>
            <div className="flex flex-wrap gap-1.5">
              {existingStones
                .filter((s) => s.includes(draft.layer_6_core_stone) || draft.layer_6_core_stone.includes(s))
                .slice(0, 8)
                .map((s) => (
                  <span
                    key={s}
                    className="px-2 py-1 rounded-full text-xs cursor-pointer border"
                    style={{ borderColor: 'var(--color-border)' }}
                    onClick={() => setField(s)}
                  >
                    {s}
                  </span>
                ))}
            </div>
          </div>
        )}

        <div className="text-right mt-2">
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {draft[step.key].length} 字
          </span>
        </div>
      </div>

      {/* 步骤指示器 */}
      <div className="flex justify-center gap-2 mb-6">
        {STONE_STEPS.map((s) => (
          <div
            key={s.index}
            className="w-2 h-2 rounded-full transition-colors"
            style={{
              background:
                s.index === draft.current_step
                  ? 'var(--color-accent)'
                  : s.index < draft.current_step
                    ? 'var(--color-text-secondary)'
                    : 'var(--color-border)',
            }}
          />
        ))}
      </div>

      {/* 底部按钮 */}
      <div className="flex gap-3">
        {draft.current_step > 0 && (
          <button onClick={goPrev} className="btn btn-secondary flex-1">
            ← 上一步
          </button>
        )}

        {draft.current_step < 5 ? (
          <button onClick={goNext} className="btn btn-primary flex-1">
            下一步 →
          </button>
        ) : (
          <button
            onClick={handleSave}
            className="btn btn-primary flex-1"
            disabled={!draft.layer_6_core_stone.trim() || saving}
          >
            {saving ? '保存中...' : '🎉 捞出这块石头'}
          </button>
        )}
      </div>
    </div>
  )
}
