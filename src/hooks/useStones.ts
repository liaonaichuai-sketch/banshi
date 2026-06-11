import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Stone, StoneCreate, StoneUpdate, StoneFilters, StoneRanking, MonthlyTrend, RiverbedData } from '../types'

export function useStones(userId: string | undefined) {
  const [stones, setStones] = useState<Stone[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const PAGE_SIZE = 20

  const fetchStones = useCallback(async (filters: StoneFilters, pageNum: number = 0) => {
    if (!userId) return

    setLoading(true)
    let query = supabase
      .from('stones')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)

    // 搜索
    if (filters.search) {
      query = query.or(
        `layer_1_fact.ilike.%${filters.search}%,layer_2_reaction.ilike.%${filters.search}%,layer_3_want.ilike.%${filters.search}%,layer_4_fear.ilike.%${filters.search}%,layer_5_rationalization.ilike.%${filters.search}%,layer_6_core_stone.ilike.%${filters.search}%`
      )
    }

    // 时间筛选
    if (filters.timeRange !== 'all' && filters.timeRange !== 'custom') {
      const now = new Date()
      let start = new Date()
      if (filters.timeRange === 'month') start.setMonth(now.getMonth() - 1)
      else if (filters.timeRange === 'quarter') start.setMonth(now.getMonth() - 3)
      else if (filters.timeRange === 'year') start.setFullYear(now.getFullYear() - 1)
      query = query.gte('created_at', start.toISOString())
    }

    if (filters.timeRange === 'custom' && filters.customStart) {
      query = query.gte('created_at', filters.customStart)
      if (filters.customEnd) query = query.lte('created_at', filters.customEnd)
    }

    // 主石头筛选
    if (filters.coreStones.length > 0) {
      query = query.in('layer_6_core_stone', filters.coreStones)
    }

    // 标签筛选
    if (filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags)
    }

    // 排序
    query = query.order('created_at', { ascending: filters.sort === 'oldest' })

    // 分页
    const from = pageNum * PAGE_SIZE
    const to = from + PAGE_SIZE - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (!error) {
      const newStones = pageNum === 0 ? data : [...stones, ...data]
      setStones(newStones as Stone[])
      setTotal(count ?? 0)
      setHasMore((data?.length ?? 0) === PAGE_SIZE)
      setPage(pageNum)
    }

    setLoading(false)
  }, [userId, stones])

  const createStone = async (data: StoneCreate) => {
    if (!userId) return null
    const { data: result, error } = await supabase
      .from('stones')
      .insert({ ...data, user_id: userId })
      .select()
      .single()
    if (error) throw error
    return result as Stone
  }

  const updateStone = async (id: string, data: StoneUpdate) => {
    const { error } = await supabase.from('stones').update(data).eq('id', id)
    if (error) throw error
  }

  const deleteStone = async (id: string) => {
    const { error } = await supabase.from('stones').delete().eq('id', id)
    if (error) throw error
  }

  const getStone = async (id: string): Promise<Stone | null> => {
    const { data, error } = await supabase.from('stones').select().eq('id', id).single()
    if (error) return null
    return data as Stone
  }

  const getCoreStones = async (): Promise<{ name: string; count: number }[]> => {
    if (!userId) return []
    const { data } = await supabase.from('stones').select('layer_6_core_stone').eq('user_id', userId)
    const counts: Record<string, number> = {}
    ;(data ?? []).forEach((s: { layer_6_core_stone: string }) => {
      counts[s.layer_6_core_stone] = (counts[s.layer_6_core_stone] || 0) + 1
    })
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
  }

  const getAllTags = async (): Promise<string[]> => {
    if (!userId) return []
    const { data } = await supabase.from('stones').select('tags').eq('user_id', userId)
    const tagSet = new Set<string>()
    ;(data ?? []).forEach((s: { tags: string[] }) => s.tags?.forEach((t) => tagSet.add(t)))
    return [...tagSet].sort()
  }

  const getRiverbedData = async (
    period: 'month' | 'quarter' | 'year' | 'all'
  ): Promise<RiverbedData> => {
    if (!userId) return { rankings: [], monthlyTrends: [], totalStones: 0, periodStart: '', periodEnd: '' }

    let query = supabase.from('stones').select('layer_6_core_stone, created_at, mood_score').eq('user_id', userId)

    const now = new Date()
    let startDate = new Date(0)
    if (period !== 'all') {
      if (period === 'month') startDate.setMonth(now.getMonth() - 1)
      else if (period === 'quarter') startDate.setMonth(now.getMonth() - 3)
      else if (period === 'year') startDate.setFullYear(now.getFullYear() - 1)
      query = query.gte('created_at', startDate.toISOString())
    }

    const { data } = await query
    const stones = (data ?? []) as { layer_6_core_stone: string; created_at: string; mood_score: number | null }[]

    // 排行榜
    const countMap: Record<string, number> = {}
    stones.forEach((s) => {
      countMap[s.layer_6_core_stone] = (countMap[s.layer_6_core_stone] || 0) + 1
    })
    const rankings: StoneRanking[] = Object.entries(countMap)
      .map(([core_stone, count]) => ({ core_stone, count, percentage: Math.round((count / stones.length) * 100) }))
      .sort((a, b) => b.count - a.count)

    // 月度趋势
    const monthMap: Record<string, { count: number; moods: number[] }> = {}
    stones.forEach((s) => {
      const month = s.created_at.slice(0, 7)
      if (!monthMap[month]) monthMap[month] = { count: 0, moods: [] }
      monthMap[month].count++
      if (s.mood_score) monthMap[month].moods.push(s.mood_score)
    })
    const monthlyTrends: MonthlyTrend[] = Object.entries(monthMap)
      .map(([month, d]) => ({
        month,
        count: d.count,
        avg_mood: d.moods.length > 0 ? Math.round((d.moods.reduce((a, b) => a + b, 0) / d.moods.length) * 10) / 10 : null,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))

    return {
      rankings,
      monthlyTrends,
      totalStones: stones.length,
      periodStart: period === 'all' ? '' : startDate.toISOString(),
      periodEnd: now.toISOString(),
    }
  }

  return {
    stones, loading, total, hasMore, page,
    fetchStones, createStone, updateStone, deleteStone, getStone,
    getCoreStones, getAllTags, getRiverbedData,
  }
}
