/*
  # Update progress calculation

  1. Changes
    - Improve progress calculation function to handle edge cases
    - Update trigger to recalculate progress on value changes
    - Add validation for numeric values

  2. Details
    - Progress is calculated as a percentage between initial and target values
    - Current value determines the actual progress
    - Values can be increasing or decreasing goals
    - Progress is capped between 0% and 100%
*/

-- Improve progress calculation function
CREATE OR REPLACE FUNCTION calculate_kr_progress(
  initial_val numeric,
  current_val numeric,
  target_val numeric
) RETURNS numeric AS $$
DECLARE
  progress numeric;
BEGIN
  -- If current value is null, return 0
  IF current_val IS NULL THEN
    RETURN 0;
  END IF;

  -- If initial and target are null, return 0
  IF initial_val IS NULL OR target_val IS NULL THEN
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

-- Update the trigger function
CREATE OR REPLACE FUNCTION update_kr_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update progress if we have all required values
  IF NEW.initial_value IS NOT NULL AND NEW.target_value IS NOT NULL THEN
    NEW.progress := calculate_kr_progress(NEW.initial_value, NEW.current_value, NEW.target_value);
  ELSE
    NEW.progress := 0;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_progress_on_values_change ON key_results;

-- Create new trigger
CREATE TRIGGER update_progress_on_values_change
  BEFORE INSERT OR UPDATE OF initial_value, current_value, target_value
  ON key_results
  FOR EACH ROW
  EXECUTE FUNCTION update_kr_progress();