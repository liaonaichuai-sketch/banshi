-- 搬石上山 v1.0 数据库初始迁移
-- 在 Supabase SQL Editor 中运行此文件

-- ============================================================
-- 1. 扩展
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 2. 石头表（核心）
-- ============================================================
CREATE TABLE IF NOT EXISTS stones (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 六层结构
  layer_1_fact          TEXT        NOT NULL DEFAULT '',
  layer_2_reaction      TEXT        NOT NULL DEFAULT '',
  layer_3_want          TEXT        NOT NULL DEFAULT '',
  layer_4_fear          TEXT        NOT NULL DEFAULT '',
  layer_5_rationalization TEXT      NOT NULL DEFAULT '',
  layer_6_core_stone    TEXT        NOT NULL,

  -- 元数据
  tags                  TEXT[]      DEFAULT '{}',
  mood_score            SMALLINT    CHECK (mood_score IS NULL OR (mood_score >= 1 AND mood_score <= 5)),
  source                TEXT        DEFAULT 'full_flow' CHECK (source IN ('full_flow', 'quick_note_converted')),

  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_stones_user_id     ON stones(user_id);
CREATE INDEX IF NOT EXISTS idx_stones_created_at  ON stones(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stones_core_stone  ON stones(user_id, layer_6_core_stone);
CREATE INDEX IF NOT EXISTS idx_stones_tags        ON stones USING GIN(tags);

-- updated_at 自动更新
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_stones_updated_at
  BEFORE UPDATE ON stones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS: 用户只能访问自己的石头
ALTER TABLE stones ENABLE ROW LEVEL SECURITY;

CREATE POLICY stones_select_policy ON stones
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY stones_insert_policy ON stones
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY stones_update_policy ON stones
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY stones_delete_policy ON stones
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 3. 快速记录表
-- ============================================================
CREATE TABLE IF NOT EXISTS quick_notes (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content               TEXT        NOT NULL,
  converted_to_stone_id UUID        REFERENCES stones(id) ON DELETE SET NULL,
  is_converted          BOOLEAN     DEFAULT false,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quick_notes_user_id ON quick_notes(user_id, created_at DESC);

ALTER TABLE quick_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY quick_notes_select_policy ON quick_notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY quick_notes_insert_policy ON quick_notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY quick_notes_update_policy ON quick_notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY quick_notes_delete_policy ON quick_notes
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 4. 收藏表
-- ============================================================
CREATE TABLE IF NOT EXISTS collections (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  type          TEXT        NOT NULL CHECK (type IN ('article','book','video','viewpoint')),
  title         TEXT        NOT NULL,
  url           TEXT,
  summary       TEXT        NOT NULL DEFAULT '',
  understanding TEXT        NOT NULL DEFAULT '',
  thinking      TEXT        NOT NULL DEFAULT '',

  tags          TEXT[]      DEFAULT '{}',

  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_collections_user_id ON collections(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_collections_type     ON collections(user_id, type);

CREATE TRIGGER trg_collections_updated_at
  BEFORE UPDATE ON collections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY collections_select_policy ON collections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY collections_insert_policy ON collections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY collections_update_policy ON collections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY collections_delete_policy ON collections
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 5. 导出日志表
-- ============================================================
CREATE TABLE IF NOT EXISTS export_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  format      TEXT        NOT NULL CHECK (format IN ('json','csv','markdown')),
  scope       TEXT        NOT NULL CHECK (scope IN ('all','stones','collections')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE export_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY export_logs_select_policy ON export_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY export_logs_insert_policy ON export_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
