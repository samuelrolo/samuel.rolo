/**
 * Supabase Configuration for Share2Inspire
 * This file contains the configuration for Supabase integration
 */

// Supabase Project Configuration
const SUPABASE_CONFIG = {
    PROJECT_ID: 'cvlumvgrbuolrnwrtrgz',
    PROJECT_URL: 'https://cvlumvgrbuolrnwrtrgz.supabase.co',
    ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bHVtdmdyYnVvbHJud3J0cmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjQyNzMsImV4cCI6MjA4Mzk0MDI3M30.DAowq1KK84KDJEvHL-0ztb-zN6jyeC1qVLLDMpTaRLM',
    DOMAIN: 'share2inspire.pt',
    ASSISTANT_EMAIL: 'samuel.rolo@share2inspire.pt'
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SUPABASE_CONFIG;
}
