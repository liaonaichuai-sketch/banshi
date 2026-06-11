import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import type { ExportFormat, ExportScope } from '../types'

export default function Settings() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [exporting, setExporting] = useState(false)
  const [exportMsg, setExportMsg] = useState('')

  const handleExport = async (format: ExportFormat, scope: ExportScope) => {
    try {
      setExporting(true)
      setExportMsg('')
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
      const dateStr = new Date().toISOString().slice(0, 10)

      if (format === 'json') {
        content = JSON.stringify(exportData, null, 2)
        filename = `banshi-export-${dateStr}.json`
      } else if (format === 'csv') {
        if (exportData.length > 0) {
          const headers = Object.keys(exportData[0] as object)
          const rows = exportData.map((row) =>
            headers
              .map((h) => {
                const v = (row as Record<string, unknown>)[h]
                if (Array.isArray(v)) return `"${v.join(';')}"`
                if (typeof v === 'string') return `"${v.replace(/"/g, '""')}"`
                return String(v ?? '')
              })
              .join(',')
          )
          content = [headers.join(','), ...rows].join('\n')
        }
        filename = `banshi-export-${dateStr}.csv`
      } else if (format === 'markdown') {
        const stones = exportData.filter((d) => (d as { layer_6_core_stone?: string }).layer_6_core_stone)
        content = `# 搬石上山 — 数据导出\n\n导出时间：${dateStr}\n\n共 ${stones.length} 块石头\n\n---\n\n`
        stones.forEach((s: unknown, i: number) => {
          const st = s as { layer_6_core_stone: string; layer_1_fact: string; created_at: string }
          content += `## ${i + 1}. ${st.layer_6_core_stone}\n\n`
          content += `**日期**：${st.created_at?.slice(0, 10)}\n\n`
          content += `**事实**：${st.layer_1_fact?.slice(0, 200) || '无'}\n\n---\n\n`
        })
        filename = `banshi-export-${dateStr}.md`
      }

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
      setExportMsg(`已导出为 ${filename}`)
    } catch (e) {
      setExportMsg('导出失败')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="page-container py-6">
      <h1 className="text-2xl font-semibold mb-8">设置</h1>

      {/* 账户信息 */}
      <div className="card">
        <h2 className="font-medium mb-3">账户信息</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span style={{ color: 'var(--color-text-secondary)' }}>邮箱</span>
            <span>{user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: 'var(--color-text-secondary)' }}>昵称</span>
            <span>{user?.nickname || '未设置'}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: 'var(--color-text-secondary)' }}>注册时间</span>
            <span>{user?.created_at ? new Date(user.created_at).toISOString().slice(0, 10) : '—'}</span>
          </div>
        </div>
      </div>

      {/* 数据导出 */}
      <div className="card">
        <h2 className="font-medium mb-3">导出数据</h2>
        <p className="text-sm mb-3" style={{ color: 'var(--color-text-secondary)' }}>
          导出你所有的石头和收藏数据。数据包含完整的时间记录。
        </p>
        <div className="flex flex-wrap gap-2 mb-2">
          <button onClick={() => handleExport('json', 'all')} className="btn btn-secondary btn-sm" disabled={exporting}>
            JSON 格式
          </button>
          <button onClick={() => handleExport('csv', 'all')} className="btn btn-secondary btn-sm" disabled={exporting}>
            CSV 格式
          </button>
          <button onClick={() => handleExport('markdown', 'stones')} className="btn btn-secondary btn-sm" disabled={exporting}>
            Markdown 格式
          </button>
        </div>
        {exportMsg && (
          <p className="text-xs" style={{ color: exportMsg.includes('失败') ? '#e53e3e' : 'var(--color-text-secondary)' }}>
            {exportMsg}
          </p>
        )}
      </div>

      {/* 关于 */}
      <div className="card">
        <h2 className="font-medium mb-3">关于</h2>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          搬石上山 v1.0
          <br />
          帮助自己觉察情绪、困惑、欲望和恐惧。
          <br />
          一层层向下挖掘，找到问题背后的「石头」。
        </p>
      </div>

      {/* 退出登录 */}
      <button
        onClick={async () => {
          await signOut()
          navigate('/auth')
        }}
        className="btn btn-secondary btn-block mt-4"
      >
        退出登录
      </button>
    </div>
  )
}
