-- Create scenarios table
CREATE TABLE scenarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add scenario_id to transactions table
ALTER TABLE transactions ADD COLUMN scenario_id UUID REFERENCES scenarios(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX idx_scenarios_user_id ON scenarios(user_id);
CREATE INDEX idx_transactions_scenario_id ON transactions(scenario_id);

-- Enable RLS
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for scenarios
CREATE POLICY "Users can view their own scenarios" ON scenarios
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scenarios" ON scenarios
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scenarios" ON scenarios
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scenarios" ON scenarios
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to ensure only one default scenario per user
CREATE OR REPLACE FUNCTION ensure_single_default_scenario()
RETURNS TRIGGER AS $$
BEGIN
  -- If the new record is being set as default, unset all other defaults for this user
  IF NEW.is_default = true THEN
    UPDATE scenarios 
    SET is_default = false 
    WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to ensure only one default scenario per user
CREATE TRIGGER ensure_single_default_scenario_trigger
  BEFORE INSERT OR UPDATE ON scenarios
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_scenario();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at
CREATE TRIGGER update_scenarios_updated_at
  BEFORE UPDATE ON scenarios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 