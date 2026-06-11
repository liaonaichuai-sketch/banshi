import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useCollections } from '../hooks/useCollections'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { COLLECTION_TYPE_LABELS, COLLECTION_TYPE_ICONS, type Collection, type CollectionCreate, type CollectionType } from '../types'

export default function CollectionDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { getCollection, createCollection, updateCollection, deleteCollection } = useCollections(user?.id)
  const navigate = useNavigate()

  const isNew = id === 'new'
  const [collection, setCollection] = useState<Collection | null>(null)
  const [editing, setEditing] = useState(isNew)
  const [form, setForm] = useState<CollectionCreate>({
    type: 'article',
    title: '',
    url: '',
    summary: '',
    understanding: '',
    thinking: '',
    tags: [],
  })
  const [showDelete, setShowDelete] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isNew && id) {
      getCollection(id).then((c) => {
        if (c) {
          setCollection(c)
          setForm({
            type: c.type,
            title: c.title,
            url: c.url ?? '',
            summary: c.summary,
            understanding: c.understanding,
            thinking: c.thinking,
            tags: c.tags,
          })
        }
      })
    }
  }, [id, isNew])

  const handleSave = async () => {
    if (!form.title.trim()) return
    setSaving(true)

    if (isNew) {
      const created = await createCollection(form)
      if (created) navigate(`/collections/${created.id}`)
    } else if (collection) {
      await updateCollection(collection.id, form)
      const updated = await getCollection(collection.id)
      if (updated) setCollection(updated)
      setEditing(false)
    }

    setSaving(false)
  }

  const handleDelete = async () => {
    if (!collection) return
    await deleteCollection(collection.id)
    navigate('/collections')
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
  }

  // 新建模式
  if (isNew) {
    return (
      <div className="page-container py-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate('/collections')} className="text-sm underline" style={{ color: 'var(--color-text-muted)' }}>
            ← 返回
          </button>
          <h1 className="text-xl font-semibold">新增收藏</h1>
          <div />
        </div>
        <CollectionForm form={form} setForm={setForm} />
        <button onClick={handleSave} className="btn btn-primary btn-block mt-4" disabled={saving || !form.title.trim()}>
          {saving ? '保存中...' : '保存'}
        </button>
      </div>
    )
  }

  // 加载中
  if (!collection) {
    return <div className="page-container py-12 text-center" style={{ color: 'var(--color-text-muted)' }}>加载中...</div>
  }

  return (
    <div className="page-container py-6">
      {/* 顶部 */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate('/collections')} className="text-sm underline" style={{ color: 'var(--color-text-muted)' }}>
          ← 返回
        </button>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button onClick={() => setEditing(false)} className="btn btn-secondary btn-sm">取消</button>
              <button onClick={handleSave} className="btn btn-primary btn-sm" disabled={saving}>
                {saving ? '保存中...' : '保存'}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)} className="btn btn-secondary btn-sm">编辑</button>
              <button onClick={() => setShowDelete(true)} className="btn btn-danger btn-sm">删除</button>
            </>
          )}
        </div>
      </div>

      {/* 详情 / 编辑 */}
      {editing ? (
        <CollectionForm form={form} setForm={setForm} />
      ) : (
        <>
          {/* 类型和标题 */}
          <div className="card mb-4">
            <p className="text-2xl mb-1">{COLLECTION_TYPE_ICONS[collection.type]}</p>
            <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>
              {COLLECTION_TYPE_LABELS[collection.type]}
            </p>
            <h2 className="text-xl font-semibold">{collection.title}</h2>
            {collection.url && (
              <a
                href={collection.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm underline mt-1 inline-block"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                🔗 {collection.url}
              </a>
            )}
            <p className="text-xs mt-3" style={{ color: 'var(--color-text-muted)' }}>
              {formatDate(collection.created_at)}
              {collection.updated_at !== collection.created_at && `（${formatDate(collection.updated_at)} 编辑过）`}
            </p>
          </div>

          {/* 内容摘要 */}
          {collection.summary && (
            <div className="card">
              <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>内容摘要</h3>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{collection.summary}</p>
            </div>
          )}

          {/* 我的理解 */}
          {collection.understanding && (
            <div className="card">
              <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>我的理解</h3>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{collection.understanding}</p>
            </div>
          )}

          {/* 我的思考 */}
          {collection.thinking && (
            <div className="card">
              <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>我的思考</h3>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{collection.thinking}</p>
            </div>
          )}

          {/* 标签 */}
          {collection.tags.length > 0 && (
            <div className="flex gap-1.5 mt-4">
              {collection.tags.map((tag) => (
                <span key={tag} className="px-2 py-1 rounded-full text-xs" style={{ background: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={showDelete}
        title="删除收藏"
        message="确认删除这条收藏？"
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
        confirmText="删除"
        danger
      />
    </div>
  )
}

/* 收藏表单组件（编辑/新增共用） */
function CollectionForm({
  form,
  setForm,
}: {
  form: CollectionCreate
  setForm: (f: CollectionCreate) => void
}) {
  const update = (patch: Partial<CollectionCreate>) => setForm({ ...form, ...patch })

  return (
    <div className="space-y-4">
      {/* 类型 */}
      <div>
        <label className="text-sm font-medium mb-1.5 block">类型</label>
        <div className="flex gap-2">
          {(Object.keys(COLLECTION_TYPE_LABELS) as CollectionType[]).map((t) => (
            <button
              key={t}
              onClick={() => update({ type: t })}
              className="btn btn-sm"
              style={{
                background: form.type === t ? 'var(--color-accent)' : 'var(--color-surface)',
                color: form.type === t ? 'var(--color-bg)' : 'var(--color-text)',
                border: form.type === t ? 'none' : '1px solid var(--color-border)',
              }}
            >
              {COLLECTION_TYPE_ICONS[t]} {COLLECTION_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">标题 *</label>
        <input value={form.title} onChange={(e) => update({ title: e.target.value })} placeholder="例如：《被讨厌的勇气》" />
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">链接（可选）</label>
        <input value={form.url ?? ''} onChange={(e) => update({ url: e.target.value })} placeholder="https://..." />
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">内容摘要</label>
        <textarea
          value={form.summary}
          onChange={(e) => update({ summary: e.target.value })}
          placeholder="这本书/文章/视频主要讲了什么..."
          style={{ minHeight: 100 }}
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">我的理解</label>
        <textarea
          value={form.understanding}
          onChange={(e) => update({ understanding: e.target.value })}
          placeholder="我怎么理解这些内容..."
          style={{ minHeight: 100 }}
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">我的思考</label>
        <textarea
          value={form.thinking}
          onChange={(e) => update({ thinking: e.target.value })}
          placeholder="联系我自己的经验..."
          style={{ minHeight: 100 }}
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">标签（逗号分隔）</label>
        <input
          value={form.tags.join(', ')}
          onChange={(e) => update({ tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })}
          placeholder="心理学, 自我成长"
        />
      </div>
    </div>
  )
}
