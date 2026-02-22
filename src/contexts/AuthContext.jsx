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

        if (!isSupabaseConfigured) {
            setLoading(false);
            return;
        }

        supabase.auth.getSession().then(({ data: { session } }) => {
            if (isMounted.current) {
                setUser(session?.user ?? null);
                setLoading(false);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                if (isMounted.current) {
                    setUser(session?.user ?? null);
                    setIsDemo(false);
                }
            }
        );

        return () => {
            isMounted.current = false;
            subscription.unsubscribe();
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
        if (isDemo || !isSupabaseConfigured) {
            setUser(null);
            setIsDemo(false);
            return;
        }
        await supabase.auth.signOut();
        setUser(null);
    }, [isDemo]);

    const value = {
        user,
        loading,
        isDemo,
        isAuthenticated: !!user,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
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
