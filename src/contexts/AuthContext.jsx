import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isDemo, setIsDemo] = useState(false);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;

        const initAuth = async () => {
            // Priority 1: Supabase Session
            if (isSupabaseConfigured) {
                const { data: { session } } = await supabase.auth.getSession();
                if (isMounted.current && session) {
                    setUser(session.user);
                    setLoading(false);
                    return;
                }
            }

            // Priority 2: Custom HMAC Token (mf_auth_token)
            const backupToken = localStorage.getItem('mf_auth_token');
            if (backupToken && isMounted.current) {
                try {
                    // Decodifica parte do payload (userId.timestamp.sig)
                    const payload = backupToken.split('.')[0];
                    if (payload) {
                        setUser({
                            id: payload,
                            email: payload.includes('@') ? payload : `${payload}@metafin.internal`,
                            is_custom: true
                        });
                    }
                } catch (_e) {
                    localStorage.removeItem('mf_auth_token');
                }
            }

            if (isMounted.current) setLoading(false);
        };

        initAuth();

        let subscription = null;
        if (isSupabaseConfigured) {
            const { data } = supabase.auth.onAuthStateChange(
                (_event, session) => {
                    if (isMounted.current) {
                        setUser(session?.user ?? null);
                        if (session?.user) setIsDemo(false);
                    }
                }
            );
            subscription = data.subscription;
        }

        return () => {
            isMounted.current = false;
            if (subscription) subscription.unsubscribe();
        };
    }, []);

    const signIn = useCallback(async (email, password) => {
        if (!isSupabaseConfigured) throw new Error('Conexão recusada: Supabase offline.');
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        try {
            const { data: mfa } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
            if (mfa && mfa.nextLevel === 'aal2' && mfa.currentLevel !== 'aal2') {
                return { data, mfaRequired: true, error: null };
            }
        } catch (e) {
            console.warn("MFA check failed, proceeding without MFA", e);
        }

        return { data, mfaRequired: false, error: null };
    }, []);

    const getMfaFactors = useCallback(async () => {
        if (!isSupabaseConfigured) return { factors: [] };
        const { data, error } = await supabase.auth.mfa.listFactors();
        if (error) throw error;
        return data;
    }, []);

    const verifyMfa = useCallback(async (factorId, code) => {
        if (!isSupabaseConfigured) throw new Error('Conexão recusada.');
        const challenge = await supabase.auth.mfa.challenge({ factorId });
        if (challenge.error) throw challenge.error;

        const { data, error } = await supabase.auth.mfa.verify({
            factorId,
            challengeId: challenge.data.id,
            code
        });
        if (error) throw error;
        return { data, error: null };
    }, []);

    const signUp = useCallback(async (email, password, fullName) => {
        if (!isSupabaseConfigured) return signIn(email, password);
        return await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName } },
        });
    }, [signIn]);

    const signInWithGoogle = useCallback(async (googleIdToken) => {
        if (!isSupabaseConfigured) throw new Error('Conexão recusada: Supabase offline.');
        const { data, error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: googleIdToken,
        });
        if (error) throw error;
        return { data, error: null };
    }, []);

    // Redefinir senha via email
    const requestPasswordReset = useCallback(async (email) => {
        if (!isSupabaseConfigured) {
            return { data: null, error: { message: 'Supabase não configurado' } };
        }
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/login`,
        });
        if (error) throw error;
        return { data, error: null };
    }, []);

    // Atualizar email do usuário
    const updateEmail = useCallback(async (newEmail) => {
        if (!isSupabaseConfigured) {
            return { data: null, error: { message: 'Supabase não configurado' } };
        }
        const { data, error } = await supabase.auth.updateUser({ email: newEmail });
        if (error) throw error;
        return { data, error: null };
    }, []);

    const signOut = useCallback(async () => {
        // Limpa token customizado se existir
        localStorage.removeItem('mf_auth_token');

        if (isDemo || !isSupabaseConfigured) {
            setUser(null);
            setIsDemo(false);
            return;
        }
        await supabase.auth.signOut();
        setUser(null);
    }, [isDemo]);

    const loginWithToken = useCallback((token) => {
        localStorage.setItem('mf_auth_token', token);
        const payload = token.split('.')[0];
        if (payload) {
            setUser({
                id: payload,
                email: payload.includes('@') ? payload : `${payload}@metafin.internal`,
                is_custom: true
            });
            return true;
        }
        return false;
    }, []);

    const value = {
        user,
        loading,
        isDemo,
        isAuthenticated: !!user,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        loginWithToken,
        requestPasswordReset,
        updateEmail,
        getMfaFactors,
        verifyMfa,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
    return context;
}
