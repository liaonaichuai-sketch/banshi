import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useStones } from '../hooks/useStones'
import type { RiverbedData, ExportFormat, ExportScope } from '../types'

export default function Riverbed() {
  const { user } = useAuth()
  const { getRiverbedData } = useStones(user?.id)

  const [period, setPeriod] = useState<'month' | 'quarter' | 'year' | 'all'>('all')
  const [data, setData] = useState<RiverbedData | null>(null)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    setLoading(true)
    getRiverbedData(period).then((d) => {
      setData(d)
      setLoading(false)
    })
  }, [period, user?.id])

  const handleExport = async (format: ExportFormat, scope: ExportScope) => {
    try {
      setExporting(true)
      // 动态导入 supabase 获取数据
      const { supabase } = await import('../lib/supabase')
      let exportData: unknown[] = []

      if (scope === 'all' || scope === 'stones') {
        const { data: stones } = await supabase.from('stones').select('*').eq('user_id', user?.id)
        exportData = [...exportData, ...(stones ?? [])]
      }
      if (scope === 'all' || scope === 'collections') {
        const { data: collections } = await supabase.from('collections').select('*').eq('user_id', user?.id)
        exportData = [...exportData, ...(collections ?? [])]
      }

      let content = ''
      let filename = ''

      if (format === 'json') {
        content = JSON.stringify(exportData, null, 2)
        filename = `banshi-export-${new Date().toISOString().slice(0, 10)}.json`
      } else if (format === 'csv') {
        if (exportData.length === 0) {
          content = ''
        } else {
          const headers = Object.keys(exportData[0] as object)
          const rows = exportData.map((row) =>
            headers.map((h) => {
              const v = (row as Record<string, unknown>)[h]
              if (Array.isArray(v)) return `"${v.join(';')}"`
              if (typeof v === 'string') return `"${v.replace(/"/g, '""')}"`
              return String(v ?? '')
            }).join(',')
          )
          content = [headers.join(','), ...rows].join('\n')
        }
        filename = `banshi-export-${new Date().toISOString().slice(0, 10)}.csv`
      } else if (format === 'markdown') {
        const stones = exportData.filter((d) => (d as { layer_6_core_stone?: string }).layer_6_core_stone)
        content = `# 搬石上山 — 数据导出\n\n导出时间：${new Date().toISOString().slice(0, 10)}\n\n共 ${stones.length} 块石头\n\n---\n\n`
        stones.forEach((s: unknown, i: number) => {
          const st = s as { layer_6_core_stone: string; layer_1_fact: string; created_at: string }
          content += `## ${i + 1}. ${st.layer_6_core_stone}\n\n`
          content += `**日期**：${st.created_at?.slice(0, 10)}\n\n`
          content += `**事实**：${st.layer_1_fact?.slice(0, 200) || '无'}\n\n---\n\n`
        })
        filename = `banshi-export-${new Date().toISOString().slice(0, 10)}.md`
      }

      // 下载
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('导出失败', e)
    } finally {
      setExporting(false)
    }
  }

  // 最长的柱子宽度
  const maxCount = data?.rankings[0]?.count ?? 1

  return (
    <div className="page-container py-6">
      <h1 className="text-2xl font-semibold mb-6">查看河床</h1>

      {/* 时间范围切换 */}
      <div className="flex gap-2 mb-6">
        {(['month', 'quarter', 'year', 'all'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className="btn btn-sm"
            style={{
              background: period === p ? 'var(--color-accent)' : 'var(--color-surface)',
              color: period === p ? 'var(--color-bg)' : 'var(--color-text)',
              border: period === p ? 'none' : '1px solid var(--color-border)',
            }}
          >
            {{ month: '近一月', quarter: '近三月', year: '近一年', all: '全部' }[p]}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center py-12" style={{ color: 'var(--color-text-muted)' }}>
          加载中...
        </p>
      ) : !data || data.totalStones === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-4">🏞️</p>
          <p style={{ color: 'var(--color-text-secondary)' }}>河床还空着，先去捞几块石头吧</p>
        </div>
      ) : (
        <>
          {/* 主石头排行榜 */}
          <div className="card mb-6">
            <h2 className="font-semibold mb-4">
              主石头排行榜
              <span className="text-sm font-normal ml-2" style={{ color: 'var(--color-text-muted)' }}>
                共 {data.totalStones} 块
              </span>
            </h2>
            <div className="space-y-3">
              {data.rankings.map((r) => (
                <div key={r.core_stone}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{r.core_stone}</span>
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {r.count} 次 · {r.percentage}%
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full" style={{ background: 'var(--color-border)' }}>
                    <div
                      className="h-3 rounded-full transition-all"
                      style={{
                        width: `${Math.max((r.count / maxCount) * 100, 3)}%`,
                        background: 'var(--color-accent)',
                        opacity: 0.7 + (r.count / maxCount) * 0.3,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 月度趋势 */}
          <div className="card mb-6">
            <h2 className="font-semibold mb-4">月度趋势</h2>
            {data.monthlyTrends.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>暂无足够的月度数据</p>
            ) : (
              <div className="space-y-1">
                <div className="flex items-end gap-1 h-32 mb-2">
                  {data.monthlyTrends.map((m) => {
                    const maxMonthly = Math.max(...data.monthlyTrends.map((t) => t.count), 1)
                    const height = (m.count / maxMonthly) * 100
                    return (
                      <div
                        key={m.month}
                        className="flex-1 flex flex-col items-center justify-end"
                        title={`${m.month}: ${m.count} 块`}
                      >
                        <div
                          className="w-full max-w-[40px] rounded-t transition-all"
                          style={{
                            height: `${Math.max(height, 3)}%`,
                            background: 'var(--color-accent)',
                            opacity: 0.8,
                          }}
                        />
                      </div>
                    )
                  })}
                </div>
                <div className="flex gap-1">
                  {data.monthlyTrends.map((m) => (
                    <div key={m.month} className="flex-1 text-center">
                      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {m.month.slice(5)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {data.monthlyTrends.length >= 2 && (
              <div className="mt-3 flex gap-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                <span>
                  本月：{data.monthlyTrends[data.monthlyTrends.length - 1]?.count ?? 0} 块
                </span>
                <span>
                  环比：
                  {(() => {
                    const len = data.monthlyTrends.length
                    if (len < 2) return '—'
                    const cur = data.monthlyTrends[len - 1].count
                    const prev = data.monthlyTrends[len - 2].count
                    if (prev === 0) return cur > 0 ? '↑' : '—'
                    const change = Math.round(((cur - prev) / prev) * 100)
                    return change > 0 ? `↑ ${change}%` : change < 0 ? `↓ ${Math.abs(change)}%` : '持平'
                  })()}
                </span>
              </div>
            )}
          </div>

          {/* 导出数据 */}
          <div className="card">
            <h2 className="font-semibold mb-4">导出数据</h2>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => handleExport('json', 'all')} className="btn btn-secondary btn-sm" disabled={exporting}>
                JSON
              </button>
              <button onClick={() => handleExport('csv', 'all')} className="btn btn-secondary btn-sm" disabled={exporting}>
                CSV
              </button>
              <button onClick={() => handleExport('markdown', 'stones')} className="btn btn-secondary btn-sm" disabled={exporting}>
                Markdown
              </button>
            </div>
            <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
              导出数据包含时间信息，JSON/CSV 包含全部字段，Markdown 仅导出石头摘要
            </p>
          </div>
        </>
      )}
    </div>
  )
}
