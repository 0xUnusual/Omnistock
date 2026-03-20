import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { User, UserRole } from '../types';

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                fetchProfile(session.user.id, session.user.email!);
            } else {
                setLoading(false);
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                fetchProfile(session.user.id, session.user.email!);
            } else {
                setUser(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    async function fetchProfile(userId: string, email: string) {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*, organization:organizations(*)')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Error fetching profile:', error);
                // Fallback
                setUser({
                    id: userId,
                    email: email,
                    nombre: 'Usuario',
                    role: 'admin',
                    organization_id: ''
                });
            } else if (data) {
                setUser({
                    id: data.id,
                    email: data.email,
                    nombre: data.nombre,
                    role: data.role as UserRole,
                    organization_id: data.organization_id,
                    organization: data.organization
                });
            }
        } catch (error) {
            console.error('Error in fetchProfile:', error);
        } finally {
            setLoading(false);
        }
    }

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    return { 
        user, 
        loading, 
        signOut,
        refresh: () => {
            supabase.auth.getSession().then(({ data: { session } }) => {
                if (session?.user) fetchProfile(session.user.id, session.user.email!);
            });
        }
    };
}
