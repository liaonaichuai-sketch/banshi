import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useStones } from '../hooks/useStones'
import type { StoneFilters } from '../types'

export default function Stones() {
  const { user } = useAuth()
  const { stones, loading, total, hasMore, page, fetchStones, getCoreStones, getAllTags } = useStones(user?.id)

  const [coreStoneList, setCoreStoneList] = useState<{ name: string; count: number }[]>([])
  const [tagList, setTagList] = useState<string[]>([])
  const [filters, setFilters] = useState<StoneFilters>({
    search: '',
    timeRange: 'all',
    coreStones: [],
    tags: [],
    sort: 'newest',
  })
  const [showFilters, setShowFilters] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user?.id) return
    fetchStones(filters, 0)
    getCoreStones().then(setCoreStoneList)
    getAllTags().then(setTagList)
  }, [user?.id])

  const handleSearch = useCallback(() => {
    fetchStones(filters, 0)
  }, [filters, fetchStones])

  const loadMore = () => {
    fetchStones(filters, page + 1)
  }

  const toggleCoreStone = (name: string) => {
    setFilters((prev) => ({
      ...prev,
      coreStones: prev.coreStones.includes(name)
        ? prev.coreStones.filter((s) => s !== name)
        : [...prev.coreStones, name],
    }))
  }

  const toggleTag = (tag: string) => {
    setFilters((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
    }))
  }

  // 过滤条件变化时重新搜索
  useEffect(() => {
    if (user?.id) fetchStones(filters, 0)
  }, [filters.timeRange, filters.coreStones, filters.tags, filters.sort])

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
  }

  return (
    <div className="page-container py-6">
      <h1 className="text-2xl font-semibold mb-6">以前的石头</h1>

      {/* 搜索栏 */}
      <div className="flex gap-2 mb-4">
        <input
          value={filters.search}
          onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="🔍 搜索石头..."
        />
        <button onClick={handleSearch} className="btn btn-primary btn-sm">
          搜索
        </button>
      </div>

      {/* 筛选切换 */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <select
          value={filters.timeRange}
          onChange={(e) => setFilters((prev) => ({ ...prev, timeRange: e.target.value as StoneFilters['timeRange'] }))}
          style={{ width: 'auto', padding: '6px 12px' }}
        >
          <option value="all">全部时间</option>
          <option value="month">近一月</option>
          <option value="quarter">近三月</option>
          <option value="year">近一年</option>
        </select>

        <select
          value={filters.sort}
          onChange={(e) => setFilters((prev) => ({ ...prev, sort: e.target.value as 'newest' | 'oldest' }))}
          style={{ width: 'auto', padding: '6px 12px' }}
        >
          <option value="newest">最新优先</option>
          <option value="oldest">最早优先</option>
        </select>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="btn btn-secondary btn-sm"
        >
          {showFilters ? '收起筛选' : '更多筛选'}
        </button>
      </div>

      {/* 展开的筛选器 */}
      {showFilters && (
        <div className="card mb-4 space-y-3">
          {/* 主石头筛选 */}
          {coreStoneList.length > 0 && (
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                按主石头筛选
              </p>
              <div className="flex flex-wrap gap-1.5">
                {coreStoneList.map((s) => (
                  <button
                    key={s.name}
                    onClick={() => toggleCoreStone(s.name)}
                    className="px-3 py-1 rounded-full text-xs border transition-colors"
                    style={{
                      borderColor: filters.coreStones.includes(s.name) ? 'var(--color-accent)' : 'var(--color-border)',
                      background: filters.coreStones.includes(s.name) ? 'var(--color-accent)' : 'transparent',
                      color: filters.coreStones.includes(s.name) ? 'var(--color-bg)' : 'var(--color-text)',
                    }}
                  >
                    {s.name}（{s.count}）
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 标签筛选 */}
          {tagList.length > 0 && (
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                按标签筛选
              </p>
              <div className="flex flex-wrap gap-1.5">
                {tagList.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className="px-3 py-1 rounded-full text-xs border transition-colors"
                    style={{
                      borderColor: filters.tags.includes(tag) ? 'var(--color-accent)' : 'var(--color-border)',
                      background: filters.tags.includes(tag) ? 'var(--color-accent)' : 'transparent',
                      color: filters.tags.includes(tag) ? 'var(--color-bg)' : 'var(--color-text)',
                    }}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 石头列表 */}
      {loading && stones.length === 0 ? (
        <p className="text-center py-12" style={{ color: 'var(--color-text-muted)' }}>
          加载中...
        </p>
      ) : stones.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-4">🪨</p>
          <p style={{ color: 'var(--color-text-secondary)' }}>还没有石头，去捞第一块吧</p>
          <button onClick={() => navigate('/new')} className="btn btn-primary mt-4">
            开始捞石头
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {stones.map((stone) => (
              <button
                key={stone.id}
                onClick={() => navigate(`/stones/${stone.id}`)}
                className="card w-full text-left hover:border-[var(--color-accent)] transition-colors cursor-pointer"
                style={{ display: 'block' }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium truncate">{stone.layer_6_core_stone}</span>
                      {stone.mood_score && (
                        <span className="text-xs">{['', '😞', '😕', '😐', '🙂', '😊'][stone.mood_score]}</span>
                      )}
                    </div>
                    {stone.layer_1_fact && (
                      <p
                        className="text-sm truncate"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        {stone.layer_1_fact.slice(0, 80)}
                      </p>
                    )}
                    {stone.tags.length > 0 && (
                      <div className="flex gap-1 mt-1.5">
                        {stone.tags.map((t) => (
                          <span
                            key={t}
                            className="px-1.5 py-0.5 rounded text-xs"
                            style={{ background: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-xs ml-4 whitespace-nowrap" style={{ color: 'var(--color-text-muted)' }}>
                    {formatDate(stone.created_at)}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {hasMore && (
            <div className="text-center mt-4">
              <button onClick={loadMore} className="btn btn-secondary btn-sm" disabled={loading}>
                {loading ? '加载中...' : '加载更多'}
              </button>
            </div>
          )}

          <p className="text-center mt-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            共 {total} 块石头
          </p>
        </>
      )}
    </div>
  )
}
