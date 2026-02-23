// api/health.js
export default function handler(req, res) {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.1',
        environment: process.env.NODE_ENV || 'production',
        services: {
            openai: !!process.env.OPENAI_API_KEY,
            anthropic: !!process.env.ANTHROPIC_API_KEY,
            supabase: !!process.env.VITE_SUPABASE_URL
        }
    })
}
