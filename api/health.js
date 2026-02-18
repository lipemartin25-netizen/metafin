export default function handler(req, res) {
    res.status(200).json({
        status: 'ok',
        message: 'Smart Finance API is running on Vercel Serverless',
        timestamp: new Date().toISOString()
    });
}
