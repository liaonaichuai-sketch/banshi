import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { QuickNote } from '../types'

export function useQuickNotes(userId: string | undefined) {
  const [notes, setNotes] = useState<QuickNote[]>([])
  const [loading, setLoading] = useState(false)

  const fetchNotes = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const { data } = await supabase
      .from('quick_notes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    setNotes((data ?? []) as QuickNote[])
    setLoading(false)
  }, [userId])

  const createNote = async (content: string) => {
    if (!userId) return null
    const { data, error } = await supabase
      .from('quick_notes')
      .insert({ user_id: userId, content })
      .select()
      .single()
    if (error) throw error
    await fetchNotes()
    return data as QuickNote
  }

  const convertToStone = async (noteId: string, stoneId: string) => {
    const { error } = await supabase
      .from('quick_notes')
      .update({ is_converted: true, converted_to_stone_id: stoneId })
      .eq('id', noteId)
    if (error) throw error
    await fetchNotes()
  }

  const deleteNote = async (id: string) => {
    const { error } = await supabase.from('quick_notes').delete().eq('id', id)
    if (error) throw error
    await fetchNotes()
  }

  return { notes, loading, fetchNotes, createNote, convertToStone, deleteNote }
}
