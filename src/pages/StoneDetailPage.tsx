import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useStones } from '../hooks/useStones'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import type { Stone, StoneUpdate } from '../types'

const LAYER_LABELS: { key: keyof Stone; label: string }[] = [
  { key: 'layer_1_fact', label: '第一层：事实' },
  { key: 'layer_2_reaction', label: '第二层：第一反应' },
  { key: 'layer_3_want', label: '第三层：我想得到什么' },
  { key: 'layer_4_fear', label: '第四层：我在害怕什么' },
  { key: 'layer_5_rationalization', label: '第五层：我给自己找了什么理由' },
  { key: 'layer_6_core_stone', label: '第六层：主石头' },
]

export default function StoneDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { getStone, updateStone, deleteStone } = useStones(user?.id)
  const navigate = useNavigate()

  const [stone, setStone] = useState<Stone | null>(null)
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState<StoneUpdate>({})
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(new Set(['layer_6_core_stone']))
  const [showDelete, setShowDelete] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id) return
    getStone(id).then((s) => {
      if (s) {
        setStone(s)
        setEditData({
          layer_1_fact: s.layer_1_fact,
          layer_2_reaction: s.layer_2_reaction,
          layer_3_want: s.layer_3_want,
          layer_4_fear: s.layer_4_fear,
          layer_5_rationalization: s.layer_5_rationalization,
          layer_6_core_stone: s.layer_6_core_stone,
          tags: s.tags,
          mood_score: s.mood_score,
          source: s.source,
        })
      }
    })
  }, [id])

  const toggleLayer = (key: string) => {
    setExpandedLayers((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const handleEditSave = async () => {
    if (!stone) return
    setSaving(true)
    await updateStone(stone.id, editData)
    const updated = await getStone(stone.id)
    if (updated) setStone(updated)
    setEditing(false)
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!stone) return
    await deleteStone(stone.id)
    navigate('/stones')
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
  }

  if (!stone) {
    return (
      <div className="page-container py-12 text-center" style={{ color: 'var(--color-text-muted)' }}>
        加载中...
      </div>
    )
  }

  return (
    <div className="page-container py-6">
      {/* 顶部 */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate('/stones')} className="text-sm underline" style={{ color: 'var(--color-text-muted)' }}>
          ← 返回列表
        </button>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button onClick={() => setEditing(false)} className="btn btn-secondary btn-sm">
                取消
              </button>
              <button onClick={handleEditSave} className="btn btn-primary btn-sm" disabled={saving}>
                {saving ? '保存中...' : '保存'}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)} className="btn btn-secondary btn-sm">
                编辑
              </button>
              <button onClick={() => setShowDelete(true)} className="btn btn-danger btn-sm">
                删除
              </button>
            </>
          )}
        </div>
      </div>

      {/* 日期 */}
      <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
        {formatDate(stone.created_at)}
        {stone.updated_at !== stone.created_at && `（${formatDate(stone.updated_at)} 编辑过）`}
      </p>

      {/* 主石头 */}
      {editing ? (
        <div className="mb-6">
          <label className="text-sm font-medium mb-1 block">主石头</label>
          <input
            value={editData.layer_6_core_stone ?? ''}
            onChange={(e) => setEditData((prev) => ({ ...prev, layer_6_core_stone: e.target.value }))}
          />
        </div>
      ) : (
        <div className="card text-center py-6 mb-6">
          <p className="text-sm mb-1" style={{ color: 'var(--color-text-muted)' }}>
            主石头
          </p>
          <p className="text-2xl font-semibold">{stone.layer_6_core_stone}</p>
          {stone.mood_score && (
            <p className="text-xs mt-1">{['', '😞', '😕', '😐', '🙂', '😊'][stone.mood_score]}</p>
          )}
        </div>
      )}

      {/* 标签 */}
      {editing ? (
        <div className="mb-4">
          <label className="text-sm font-medium mb-1 block">标签（逗号分隔）</label>
          <input
            value={editData.tags?.join(', ') ?? ''}
            onChange={(e) =>
              setEditData((prev) => ({
                ...prev,
                tags: e.target.value
                  .split(',')
                  .map((t) => t.trim())
                  .filter(Boolean),
              }))
            }
            placeholder="工作, 人际关系"
          />
        </div>
      ) : (
        stone.tags.length > 0 && (
          <div className="flex gap-1.5 mb-6">
            {stone.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 rounded-full text-xs"
                style={{ background: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
              >
                #{tag}
              </span>
            ))}
          </div>
        )
      )}

      {/* 六层内容 */}
      <div className="space-y-2">
        {LAYER_LABELS.map(({ key, label }) => {
          const value = editing ? (editData[key as keyof StoneUpdate] as string) ?? '' : (stone[key] as string)
          const isExpanded = expandedLayers.has(key) || editing

          return (
            <div key={key} className="card" style={{ padding: editing ? 20 : 16 }}>
              <button
                onClick={() => !editing && toggleLayer(key)}
                className="w-full text-left flex items-center justify-between"
                style={{ cursor: editing ? 'default' : 'pointer' }}
              >
                <span
                  className="text-sm font-medium"
                  style={{ color: key === 'layer_6_core_stone' ? 'var(--color-text)' : 'var(--color-text-secondary)' }}
                >
                  {editing ? label : `${isExpanded ? '▾' : '▸'} ${label}`}
                </span>
              </button>

              {isExpanded && (
                <div className="mt-3">
                  {editing ? (
                    <textarea
                      value={value}
                      onChange={(e) => setEditData((prev) => ({ ...prev, [key]: e.target.value }))}
                      style={{ minHeight: key === 'layer_6_core_stone' ? 60 : 120 }}
                    />
                  ) : (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {value || <span style={{ color: 'var(--color-text-muted)' }}>（未填写）</span>}
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 心情评分（编辑模式） */}
      {editing && (
        <div className="card mt-4">
          <label className="text-sm font-medium mb-2 block">当时的心情（可选）</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((score) => (
              <button
                key={score}
                onClick={() => setEditData((prev) => ({ ...prev, mood_score: score }))}
                className="text-2xl p-2 rounded-lg border transition-colors"
                style={{
                  borderColor: editData.mood_score === score ? 'var(--color-accent)' : 'var(--color-border)',
                  background: editData.mood_score === score ? 'var(--color-accent)' : 'transparent',
                  opacity: editData.mood_score === score ? 1 : 0.5,
                }}
              >
                {['😞', '😕', '😐', '🙂', '😊'][score - 1]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 删除确认 */}
      <ConfirmDialog
        open={showDelete}
        title="删除这块石头"
        message="删除后无法恢复，确认删除吗？"
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
        confirmText="删除"
        danger
      />
    </div>
  )
}
