/*
  # Fix progress calculation and constraints

  1. Changes
    - Remove overly strict constraint on values
    - Improve progress calculation to handle NULL values
    - Update trigger to be more flexible
    - Add better validation for numeric values

  2. Technical Details
    - Progress calculation now properly handles NULL values
    - Values can be updated independently
    - Progress is calculated only when we have enough information
    - Added validation to ensure values make sense
*/

-- Drop the old constraint as it's too strict
ALTER TABLE key_results DROP CONSTRAINT IF EXISTS check_values_not_null;

-- Add a more flexible constraint that ensures values make sense when present
ALTER TABLE key_results ADD CONSTRAINT check_values_valid
CHECK (
  -- When target_value is set, initial_value must also be set
  (target_value IS NULL OR initial_value IS NOT NULL) AND
  -- When current_value is set, both initial and target should be set
  (current_value IS NULL OR (initial_value IS NOT NULL AND target_value IS NOT NULL))
);

-- Improve progress calculation function
CREATE OR REPLACE FUNCTION calculate_kr_progress(
  initial_val numeric,
  current_val numeric,
  target_val numeric
) RETURNS numeric AS $$
DECLARE
  progress numeric;
BEGIN
  -- Return 0 if we don't have enough information to calculate progress
  IF initial_val IS NULL OR target_val IS NULL THEN
    RETURN 0;
  END IF;

  -- If current_value is NULL, use initial_value
  IF current_val IS NULL THEN
    current_val := initial_val;
  END IF;

  -- Handle maintenance goals (where target equals initial)
  IF target_val = initial_val THEN
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
  RETURN GREATEST(0, LEAST(100, ROUND(progress)));
END;
$$ LANGUAGE plpgsql;

-- Update the trigger function to be more flexible
CREATE OR REPLACE FUNCTION update_kr_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate progress if we have the minimum required values
  IF NEW.initial_value IS NOT NULL AND NEW.target_value IS NOT NULL THEN
    NEW.progress := calculate_kr_progress(NEW.initial_value, NEW.current_value, NEW.target_value);
  ELSE
    -- Set progress to 0 if we don't have enough information
    NEW.progress := 0;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS update_progress_on_values_change ON key_results;

CREATE TRIGGER update_progress_on_values_change
  BEFORE INSERT OR UPDATE OF initial_value, current_value, target_value
  ON key_results
  FOR EACH ROW
  EXECUTE FUNCTION update_kr_progress();

-- Update existing records to recalculate progress
UPDATE key_results 
SET progress = calculate_kr_progress(initial_value, current_value, target_value)
WHERE initial_value IS NOT NULL AND target_value IS NOT NULL;