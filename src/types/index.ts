// ============ 用户 ============
export interface User {
  id: string
  email: string
  nickname: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

// ============ 石头 ============
export interface Stone {
  id: string
  user_id: string
  layer_1_fact: string
  layer_2_reaction: string
  layer_3_want: string
  layer_4_fear: string
  layer_5_rationalization: string
  layer_6_core_stone: string
  tags: string[]
  mood_score: number | null
  source: 'full_flow' | 'quick_note_converted'
  created_at: string
  updated_at: string
}

export type StoneCreate = Omit<Stone, 'id' | 'user_id' | 'created_at' | 'updated_at'>
export type StoneUpdate = Partial<StoneCreate>

// 六步流程的草稿（存 localStorage）
export interface StoneDraft {
  layer_1_fact: string
  layer_2_reaction: string
  layer_3_want: string
  layer_4_fear: string
  layer_5_rationalization: string
  layer_6_core_stone: string
  current_step: number // 0-5
}

// ============ 快速记录 ============
export interface QuickNote {
  id: string
  user_id: string
  content: string
  converted_to_stone_id: string | null
  is_converted: boolean
  created_at: string
}

// ============ 收藏 ============
export type CollectionType = 'article' | 'book' | 'video' | 'viewpoint'

export interface Collection {
  id: string
  user_id: string
  type: CollectionType
  title: string
  url: string | null
  summary: string
  understanding: string
  thinking: string
  tags: string[]
  created_at: string
  updated_at: string
}

export type CollectionCreate = Omit<Collection, 'id' | 'user_id' | 'created_at' | 'updated_at'>
export type CollectionUpdate = Partial<CollectionCreate>

// ============ 河床统计 ============
export interface StoneRanking {
  core_stone: string
  count: number
  percentage: number
}

export interface MonthlyTrend {
  month: string // '2024-06'
  count: number
  avg_mood: number | null
}

export interface RiverbedData {
  rankings: StoneRanking[]
  monthlyTrends: MonthlyTrend[]
  totalStones: number
  periodStart: string
  periodEnd: string
}

// ============ 导出 ============
export type ExportFormat = 'json' | 'csv' | 'markdown'
export type ExportScope = 'all' | 'stones' | 'collections'

// ============ 筛选 ============
export interface StoneFilters {
  search: string
  timeRange: 'month' | 'quarter' | 'year' | 'all' | 'custom'
  customStart?: string
  customEnd?: string
  coreStones: string[]
  tags: string[]
  sort: 'newest' | 'oldest'
}

// 六步流程的步骤定义
export const STONE_STEPS = [
  {
    index: 0,
    key: 'layer_1_fact' as const,
    title: '第一层：事实',
    hint: '只记录发生了什么。像摄像头一样，不评价、不分析、不推测。',
    placeholder: '写下发生的事情，像写日记一样...',
  },
  {
    index: 1,
    key: 'layer_2_reaction' as const,
    title: '第二层：第一反应',
    hint: '事情发生时，你脑子里蹦出的第一个念头是什么？身体有什么感觉？',
    placeholder: '写下你最直接的反应...',
  },
  {
    index: 2,
    key: 'layer_3_want' as const,
    title: '第三层：我想得到什么',
    hint: '抛开对错，诚实地问自己：在这件事里，我真正想获得的是什么？',
    placeholder: '诚实地写下你想得到什么...',
  },
  {
    index: 3,
    key: 'layer_4_fear' as const,
    title: '第四层：我在害怕什么',
    hint: '如果事情没有按你期望的发展，你最害怕失去什么？',
    placeholder: '写下你的恐惧...',
  },
  {
    index: 4,
    key: 'layer_5_rationalization' as const,
    title: '第五层：我给自己找了什么理由',
    hint: '回顾上面几层——你给自己编了什么故事？用了什么理由来解释？',
    placeholder: '写下你的自我合理化...',
  },
  {
    index: 5,
    key: 'layer_6_core_stone' as const,
    title: '第六层：今天捞出的主石头',
    hint: '如果只用一个词或一句话来命名今天的核心问题，它是什么？',
    placeholder: '例如：怕被看轻、想证明自己、害怕失去关系...',
  },
]

// 收藏类型中文
export const COLLECTION_TYPE_LABELS: Record<CollectionType, string> = {
  article: '文章',
  book: '书籍',
  video: '视频',
  viewpoint: '观点',
}

export const COLLECTION_TYPE_ICONS: Record<CollectionType, string> = {
  article: '📄',
  book: '📖',
  video: '🎬',
  viewpoint: '💡',
}
