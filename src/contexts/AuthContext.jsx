import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { usePersistentState } from '../hooks/usePersistentState';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isDemo, setIsDemo] = useState(false);
    const isMounted = useRef(true);

    // Gestão segura do token persistente
    const [authToken, setAuthToken] = usePersistentState('auth_token', null);

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

            // Priority 2: Custom HMAC Token (mf_auth_token via usePersistentState)
            if (authToken && isMounted.current) {
                try {
                    const payload = authToken.split('.')[0];
                    if (payload) {
                        setUser({
                            id: payload,
                            email: payload.includes('@') ? payload : `${payload}@metafin.internal`,
                            is_custom: true
                        });
                    }
                } catch (_e) {
                    setAuthToken(null);
                }
            }

            // Apenas encerra o loading aqui se o Supabase não estiver configurado 
            // (pois se estiver, o onAuthStateChange cuidará disso via evento)
            if (!isSupabaseConfigured && isMounted.current) {
                setLoading(false);
            }
        };

        initAuth();

        let subscription = null;
        if (isSupabaseConfigured) {
            const { data } = supabase.auth.onAuthStateChange(
                (event, session) => {
                    if (isMounted.current) {
                        setUser(session?.user ?? null);
                        if (session?.user) setIsDemo(false);

                        // Garante que o loading seja encerrado apenas quando tivermos uma resposta real
                        // ou no primeiro evento de INITIAL_SESSION / SIGNED_IN
                        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
                            setLoading(false);
                        }
                    }
                }
            );
            subscription = data.subscription;
        }

        return () => {
            isMounted.current = false;
            if (subscription) subscription.unsubscribe();
        };
    }, [authToken, setAuthToken]);

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

    const updateEmail = useCallback(async (newEmail) => {
        if (!isSupabaseConfigured) {
            return { data: null, error: { message: 'Supabase não configurado' } };
        }
        const { data, error } = await supabase.auth.updateUser({ email: newEmail });
        if (error) throw error;
        return { data, error: null };
    }, []);

    const signOut = useCallback(async () => {
        setAuthToken(null);
        localStorage.removeItem('sf_auth_token');
        sessionStorage.clear();

        document.cookie.split(";").forEach((c) => {
            document.cookie = c
                .replace(/^ +/, "")
                .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });

        if (isDemo || !isSupabaseConfigured) {
            setUser(null);
            setIsDemo(false);
            return;
        }
        await supabase.auth.signOut();
        setUser(null);
    }, [isDemo, setAuthToken]);

    const loginWithToken = useCallback((token) => {
        setAuthToken(token);
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
    }, [setAuthToken]);

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

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
    return context;
}
