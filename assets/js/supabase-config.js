// ============================================
// Supabase Configuration for Hope A Life International
// ============================================
// This file uses ES Modules - it must be loaded with type="module"
// ============================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Supabase Project Configuration
const SUPABASE_URL = 'https://dblytjlpzwhlwkzeojlc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRibHl0amxwendobHdremVvamxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MzQ0NTUsImV4cCI6MjA3OTIxMDQ1NX0.tifZvjJhzCgqpqK2EtyC7PP_99JF-jrOg5O37tPXHjQ';

// Check if credentials are configured
if (SUPABASE_URL === 'YOUR_PROJECT_URL_HERE' || SUPABASE_ANON_KEY === 'YOUR_ANON_KEY_HERE') {
    console.warn('⚠️ Supabase credentials not configured! Please update assets/js/supabase-config.js with your Supabase URL and API key.');
    console.warn('📖 See SUPABASE-INTEGRATION-GUIDE.md for instructions.');
}

// Initialize Supabase client
let supabase = null;

try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase client initialized');
    
    // Make it globally available for non-module scripts
    window.supabase = supabase;
    window.SUPABASE_URL = SUPABASE_URL;
    window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
    
} catch (error) {
    console.error('❌ Error initializing Supabase client:', error);
}

// Export for use in other ES modules
export { supabase, SUPABASE_URL, SUPABASE_ANON_KEY };
