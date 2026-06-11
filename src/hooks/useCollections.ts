import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Collection, CollectionCreate, CollectionUpdate, CollectionType } from '../types'

export function useCollections(userId: string | undefined) {
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(false)

  const fetchCollections = useCallback(async (type?: CollectionType | 'all') => {
    if (!userId) return
    setLoading(true)
    let query = supabase
      .from('collections')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (type && type !== 'all') {
      query = query.eq('type', type)
    }

    const { data } = await query
    setCollections((data ?? []) as Collection[])
    setLoading(false)
  }, [userId])

  const createCollection = async (data: CollectionCreate) => {
    if (!userId) return null
    const { data: result, error } = await supabase
      .from('collections')
      .insert({ ...data, user_id: userId })
      .select()
      .single()
    if (error) throw error
    return result as Collection
  }

  const updateCollection = async (id: string, data: CollectionUpdate) => {
    const { error } = await supabase.from('collections').update(data).eq('id', id)
    if (error) throw error
  }

  const deleteCollection = async (id: string) => {
    const { error } = await supabase.from('collections').delete().eq('id', id)
    if (error) throw error
  }

  const getCollection = async (id: string): Promise<Collection | null> => {
    const { data, error } = await supabase.from('collections').select().eq('id', id).single()
    if (error) return null
    return data as Collection
  }

  return { collections, loading, fetchCollections, createCollection, updateCollection, deleteCollection, getCollection }
}
