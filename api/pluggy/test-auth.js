export default async function handler(req, res) {
    const { PLUGGY_CLIENT_ID, PLUGGY_CLIENT_SECRET } = process.env;

    try {
        const authResponse = await fetch('https://api.pluggy.ai/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                clientId: PLUGGY_CLIENT_ID,
                clientSecret: PLUGGY_CLIENT_SECRET,
            }),
        });

        if (!authResponse.ok) {
            const authErr = await authResponse.text();
            return res.status(authResponse.status).json({
                error: 'Pluggy auth failed',
                details: authErr,
                debug: {
                    clientIdLen: PLUGGY_CLIENT_ID ? PLUGGY_CLIENT_ID.length : 0,
                    clientSecretLen: PLUGGY_CLIENT_SECRET ? PLUGGY_CLIENT_SECRET.length : 0,
                    idFullMatch: PLUGGY_CLIENT_ID === '9139f3f4-4417-4088-a9c4-59b0ce964d3c',
                    secretFullMatch: PLUGGY_CLIENT_SECRET === '14f89eb6-c88c-4387-9ef4-ac967338f2c4'
                }
            });
        }

        const data = await authResponse.json();
        return res.status(200).json({
            success: true,
            hasApiKey: !!data.apiKey,
            debug: {
                idFullMatch: PLUGGY_CLIENT_ID === '9139f3f4-4417-4088-a9c4-59b0ce964d3c',
                secretFullMatch: PLUGGY_CLIENT_SECRET === '14f89eb6-c88c-4387-9ef4-ac967338f2c4'
            }
        });

    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
