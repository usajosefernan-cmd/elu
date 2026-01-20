
import React, { useEffect } from 'react';
import { getSupabaseClient } from '../services/authService';
import { UserProfile } from '../types';

interface JobMonitorProps {
    user: UserProfile | null;
    onJobUpdate: (activeCount: number, completedCount: number) => void;
}

export const JobMonitor: React.FC<JobMonitorProps> = ({ user, onJobUpdate }) => {
    useEffect(() => {
        if (!user) return;

        const supabase = getSupabaseClient();

        // Initial Count
        const fetchCounts = async () => {
            // Count Active
            const { count: active } = await supabase
                .from('generations')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .in('status', ['processing', 'generating_previews', 'sculpting']);

            // Count Completed (Recently? Or just 'ready' and not viewed?)
            // For now, let's just track "Active" for the spinner, and maybe last 24h completed for a badge
            const { count: completed } = await supabase
                .from('generations')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .in('status', ['previews_ready', 'completed'])
                .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24h

            onJobUpdate(active || 0, completed || 0);
        };

        fetchCounts();

        // Realtime Subscription
        const channel = supabase
            .channel('job-monitor')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'generations',
                    filter: `user_id=eq.${user.id}`
                },
                () => {
                    console.log("Job status changed, refreshing counts...");
                    fetchCounts();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    return null; // Headless component
};
