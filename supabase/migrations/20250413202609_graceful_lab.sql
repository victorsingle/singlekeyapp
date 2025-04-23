/*
  # Add current value and automatic progress calculation to key results

  1. Changes
    - Add `current_value` column to `key_results` table
    - Create function to calculate progress
    - Create trigger to automatically update progress on value changes
    - Add check constraints for value consistency

  2. Notes
    - Progress is automatically calculated via trigger
    - Handles increase, decrease and maintenance goals
    - Ensures progress stays between 0 and 100
*/

-- Add current_value column
ALTER TABLE key_results 
ADD COLUMN current_value numeric DEFAULT NULL;

-- Create a function to calculate progress
CREATE OR REPLACE FUNCTION calculate_kr_progress(
  initial_val numeric,
  current_val numeric,
  target_val numeric
) RETURNS numeric AS $$
DECLARE
  progress numeric;
BEGIN
  -- If any required value is null, return 0
  IF initial_val IS NULL OR current_val IS NULL OR target_val IS NULL THEN
    RETURN 0;
  END IF;

  -- If target equals initial, it's a maintenance goal
  IF target_val = initial_val THEN
    -- Progress is 100% if current equals target, 0% otherwise
    RETURN CASE 
      WHEN current_val = target_val THEN 100
      ELSE 0
    END;
  END IF;

  -- Calculate progress based on whether it's an increase or decrease goal
  IF target_val > initial_val THEN
    -- Increase goal
    progress := (current_val - initial_val) / (target_val - initial_val) * 100;
  ELSE
    -- Decrease goal
    progress := (initial_val - current_val) / (initial_val - target_val) * 100;
  END IF;

  -- Ensure progress stays between 0 and 100
  RETURN GREATEST(0, LEAST(100, progress));
END;
$$ LANGUAGE plpgsql;

-- Create trigger function to update progress
CREATE OR REPLACE FUNCTION update_kr_progress()
RETURNS TRIGGER AS $$
BEGIN
  NEW.progress := calculate_kr_progress(NEW.initial_value, NEW.current_value, NEW.target_value);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update progress
CREATE TRIGGER update_progress_on_values_change
  BEFORE INSERT OR UPDATE OF initial_value, current_value, target_value
  ON key_results
  FOR EACH ROW
  EXECUTE FUNCTION update_kr_progress();

-- Add check constraints to ensure value consistency
ALTER TABLE key_results
ADD CONSTRAINT check_values_not_null 
CHECK (
  (initial_value IS NULL AND target_value IS NULL AND current_value IS NULL) OR
  (initial_value IS NOT NULL AND target_value IS NOT NULL)
);