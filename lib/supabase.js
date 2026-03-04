import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vbwnyutbyhbjpdnppmex.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZid255dXRieWhianBkbnBwbWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1NjcxMjksImV4cCI6MjA4ODE0MzEyOX0.P3dNnNpLGG9Mfpiyk5IQHLr58gg2qfANhiprjjlzAFA'

export const db = createClient(supabaseUrl, supabaseKey)