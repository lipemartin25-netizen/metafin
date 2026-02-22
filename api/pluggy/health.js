export default function handler(req, res) {
    res.status(200).json({
        status: "ok",
        timestamp: new Date().toISOString(),
        message: "Smart Finance API is running on Vercel",
        diagnostics: {
            hasPluggyClientId: !!process.env.PLUGGY_CLIENT_ID,
            pluggyClientIdLen: process.env.PLUGGY_CLIENT_ID ? process.env.PLUGGY_CLIENT_ID.trim().length : 0,
            pluggyClientIdPrefix: process.env.PLUGGY_CLIENT_ID ? process.env.PLUGGY_CLIENT_ID.trim().substring(0, 4) : '',
            hasPluggyClientSecret: !!process.env.PLUGGY_CLIENT_SECRET,
            pluggyClientSecretLen: process.env.PLUGGY_CLIENT_SECRET ? process.env.PLUGGY_CLIENT_SECRET.trim().length : 0,
            hasSupabaseUrl: !!process.env.SUPABASE_URL,
        }
    });
}
