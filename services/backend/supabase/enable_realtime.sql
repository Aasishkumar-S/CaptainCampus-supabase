-- Run this in Supabase Dashboard > SQL Editor AFTER running schema.sql
-- Enables Supabase Realtime for live GPS tracking

ALTER PUBLICATION supabase_realtime ADD TABLE live_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE announcements;
ALTER PUBLICATION supabase_realtime ADD TABLE buses;
