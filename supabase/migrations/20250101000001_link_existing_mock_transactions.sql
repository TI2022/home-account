-- 既存の予定収支（isMock = true）をデフォルトシナリオに紐付け
UPDATE transactions 
SET scenario_id = (
  SELECT id 
  FROM scenarios 
  WHERE is_default = true 
  LIMIT 1
)
WHERE isMock = true 
  AND scenario_id IS NULL; 