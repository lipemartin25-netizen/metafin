function getAuthToken() {
 try {
 const customToken = localStorage.getItem('mf_auth_token')
 if (customToken) return customToken

 const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
 if (supabaseUrl) {
 const projectRef = supabaseUrl.match(/\/\/([^.]+)\./)?.[1]
 if (projectRef) {
 const key = `sb-${projectRef}-auth-token`
 const raw = localStorage.getItem(key)
 if (raw) {
 const session = JSON.parse(raw)
 if (session?.expires_at && session.expires_at * 1000 > Date.now()) {
 return session.access_token
 }
 }
 }
 }
 return null
 } catch {
 return null
 }
}

export function useIsAuthenticated() {
 return !!getAuthToken();
}

export { getAuthToken };
