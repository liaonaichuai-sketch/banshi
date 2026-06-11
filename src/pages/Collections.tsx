import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useCollections } from '../hooks/useCollections'
import { COLLECTION_TYPE_LABELS, COLLECTION_TYPE_ICONS, type CollectionType } from '../types'

export default function Collections() {
  const { user } = useAuth()
  const { collections, loading, fetchCollections, deleteCollection } = useCollections(user?.id)
  const [typeFilter, setTypeFilter] = useState<CollectionType | 'all'>('all')
  const [showDeleteId, setShowDeleteId] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (user?.id) fetchCollections(typeFilter)
  }, [user?.id, typeFilter])

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
  }

  return (
    <div className="page-container py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">我的收藏</h1>
        <button onClick={() => navigate('/collections/new')} className="btn btn-primary btn-sm">
          + 新增
        </button>
      </div>

      {/* 类型筛选 */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setTypeFilter('all')}
          className="btn btn-sm"
          style={{
            background: typeFilter === 'all' ? 'var(--color-accent)' : 'var(--color-surface)',
            color: typeFilter === 'all' ? 'var(--color-bg)' : 'var(--color-text)',
            border: typeFilter === 'all' ? 'none' : '1px solid var(--color-border)',
          }}
        >
          全部
        </button>
        {(Object.keys(COLLECTION_TYPE_LABELS) as CollectionType[]).map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className="btn btn-sm"
            style={{
              background: typeFilter === t ? 'var(--color-accent)' : 'var(--color-surface)',
              color: typeFilter === t ? 'var(--color-bg)' : 'var(--color-text)',
              border: typeFilter === t ? 'none' : '1px solid var(--color-border)',
            }}
          >
            {COLLECTION_TYPE_ICONS[t]} {COLLECTION_TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {/* 列表 */}
      {loading ? (
        <p className="text-center py-12" style={{ color: 'var(--color-text-muted)' }}>加载中...</p>
      ) : collections.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-4">⭐</p>
          <p style={{ color: 'var(--color-text-secondary)' }}>还没有收藏，去添加第一条吧</p>
        </div>
      ) : (
        <div className="space-y-2">
          {collections.map((c) => (
            <div key={c.id} className="card relative">
              <button
                onClick={() => navigate(`/collections/${c.id}`)}
                className="w-full text-left"
              >
                <div className="flex items-start gap-2 mb-1">
                  <span>{COLLECTION_TYPE_ICONS[c.type]}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{c.title}</h3>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {COLLECTION_TYPE_LABELS[c.type]} · {formatDate(c.created_at)}
                    </p>
                  </div>
                </div>
                {c.summary && (
                  <p className="text-sm mt-2 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
                    {c.summary}
                  </p>
                )}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowDeleteId(c.id)
                }}
                className="absolute top-3 right-3 text-xs underline"
                style={{ color: 'var(--color-text-muted)' }}
              >
                删除
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="text-center mt-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>
        共 {collections.length} 条收藏
      </p>

      {/* 删除确认弹窗 */}
      {showDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowDeleteId(null)} />
          <div className="relative rounded-xl p-6 w-full max-w-sm shadow-lg" style={{ background: 'var(--color-surface)' }}>
            <h3 className="text-lg font-semibold mb-2">删除收藏</h3>
            <p className="mb-6" style={{ color: 'var(--color-text-secondary)' }}>确认删除这条收藏？</p>
            <div className="flex gap-3 justify-end">
              <button className="btn btn-secondary btn-sm" onClick={() => setShowDeleteId(null)}>取消</button>
              <button
                className="btn btn-danger btn-sm"
                onClick={async () => {
                  await deleteCollection(showDeleteId)
                  setShowDeleteId(null)
                  fetchCollections(typeFilter)
                }}
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
