/*
  # Reestruturar conexões de OKRs

  1. Mudanças
    - Remover tabela antiga de links
    - Criar nova tabela para conexões diretas entre OKRs
    - Adicionar novas constraints e políticas

  2. Detalhes
    - Conexões agora são diretas entre objetivos
    - Mantém as regras de hierarquia (tático->estratégico, operacional->tático)
    - Adiciona validações para tipos de conexão
*/

-- Remover tabela antiga
DROP TABLE IF EXISTS okr_links;

-- Recriar enum para tipos de conexão
DROP TYPE IF EXISTS okr_link_type;
CREATE TYPE okr_link_type AS ENUM (
  'tactical_to_strategic',
  'operational_to_tactical'
);

-- Criar nova tabela de conexões
CREATE TABLE IF NOT EXISTS okr_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_okr_id uuid NOT NULL REFERENCES okrs(id) ON DELETE CASCADE,
  target_okr_id uuid NOT NULL REFERENCES okrs(id) ON DELETE CASCADE,
  link_type okr_link_type NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Prevenir conexões duplicadas
  UNIQUE(source_okr_id, target_okr_id),
  
  -- Garantir que source e target são diferentes
  CONSTRAINT different_source_target CHECK (source_okr_id != target_okr_id)
);

-- Habilitar RLS
ALTER TABLE okr_links ENABLE ROW LEVEL SECURITY;

-- Criar trigger de updated_at
CREATE TRIGGER update_okr_links_updated_at
    BEFORE UPDATE ON okr_links
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Criar políticas
CREATE POLICY "Users can read own links"
  ON okr_links
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own links"
  ON okr_links
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own links"
  ON okr_links
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own links"
  ON okr_links
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Criar função para validar conexões
CREATE OR REPLACE FUNCTION validate_okr_link()
RETURNS TRIGGER AS $$
DECLARE
  source_type okr_type;
  target_type okr_type;
BEGIN
  -- Buscar os tipos dos OKRs conectados
  SELECT type INTO source_type
  FROM okrs
  WHERE id = NEW.source_okr_id;
  
  SELECT type INTO target_type
  FROM okrs
  WHERE id = NEW.target_okr_id;
  
  -- Validar conexões baseado no link_type
  IF NEW.link_type = 'tactical_to_strategic' AND 
     (source_type != 'tactical' OR target_type != 'strategic') THEN
    RAISE EXCEPTION 'Invalid tactical to strategic connection';
  END IF;
  
  IF NEW.link_type = 'operational_to_tactical' AND
     (source_type != 'operational' OR target_type != 'tactical') THEN
    RAISE EXCEPTION 'Invalid operational to tactical connection';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para validação
CREATE TRIGGER validate_okr_link_trigger
  BEFORE INSERT OR UPDATE ON okr_links
  FOR EACH ROW
  EXECUTE FUNCTION validate_okr_link();