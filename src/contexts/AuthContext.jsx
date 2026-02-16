import { createContext, useContext, useState, useEffect } from 'react';
import { auth, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isSupabaseConfigured) {
            // Modo offline: check localStorage para demo user
            const demoUser = localStorage.getItem('sf_demo_user');
            if (demoUser) {
                setUser(JSON.parse(demoUser));
            }
            setLoading(false);
            return;
        }

        // Check session ativa
        const initAuth = async () => {
            try {
                const { data: { session } } = await auth.getSession();
                setUser(session?.user ?? null);
            } catch (error) {
                console.error('Auth init error:', error);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        initAuth();

        // Listener de auth state changes
        const { data: { subscription } } = auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signUp = async (email, password, name) => {
        if (!isSupabaseConfigured) {
            const demoUser = { id: 'demo', email, user_metadata: { full_name: name } };
            localStorage.setItem('sf_demo_user', JSON.stringify(demoUser));
            setUser(demoUser);
            return { data: demoUser, error: null };
        }
        const result = await auth.signUp(email, password, name);
        return result;
    };

    const signIn = async (email, password) => {
        if (!isSupabaseConfigured) {
            const demoUser = { id: 'demo', email, user_metadata: { full_name: 'Usuário Demo' } };
            localStorage.setItem('sf_demo_user', JSON.stringify(demoUser));
            setUser(demoUser);
            return { data: demoUser, error: null };
        }
        const result = await auth.signIn(email, password);
        return result;
    };

    const signInWithGoogle = async () => {
        if (!isSupabaseConfigured) {
            return { data: null, error: { message: 'Configure o Supabase para login com Google' } };
        }
        const result = await auth.signInWithGoogle();
        return result;
    };

    const signOut = async () => {
        if (!isSupabaseConfigured) {
            localStorage.removeItem('sf_demo_user');
            setUser(null);
            return { error: null };
        }
        const result = await auth.signOut();
        setUser(null);
        return result;
    };

    const value = {
        user,
        loading,
        isAuthenticated: !!user,
        isDemo: !isSupabaseConfigured,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
