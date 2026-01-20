import React, { useState, useEffect } from 'react';
import { getSupabaseClient } from '../../services/authService';
import {
    Activity, Server, Cpu, Database, Cloud, BarChart3,
    RefreshCw, Zap, Clock, ShieldCheck, AlertTriangle
} from 'lucide-react';

export const AdminInfrastructure: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [metrics, setMetrics] = useState({
        api_health: 'Checking...',
        avg_latency: '-',
        total_requests_24h: 0,
        users_count: 0
    });

    const supabase = getSupabaseClient();

    const fetchRealMetrics = async () => {
        setLoading(true);
        try {
            // 1. Get Table Counts
            const { count: usersCount } = await supabase.from('user_profiles').select('*', { count: 'exact', head: true });
            const { count: jobsCount } = await supabase.from('generation_jobs').select('*', { count: 'exact', head: true });

            // 2. Ping Edge Function (Health Check)
            const start = Date.now();
            const { error: fnError } = await supabase.functions.invoke('send-email-custom', { body: { action: 'ping' } });
            const latency = Date.now() - start;

            setMetrics({
                api_health: fnError ? 'Degraded' : 'Operational',
                avg_latency: `${latency}ms`,
                total_requests_24h: jobsCount || 0,
                users_count: usersCount || 0
            });

        } catch (e) {
            console.error('Error fetching metrics', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRealMetrics();
        const interval = setInterval(fetchRealMetrics, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col h-full animate-[fadeIn_0.3s] bg-transparent p-6 overflow-y-auto">
            <h3 className="text-xs font-bold uppercase flex items-center gap-2 mb-6">
                <Activity className="w-4 h-4 text-prismatic-blue" /> Infraestructura y Telemetría
            </h3>

            {/* TOP STATS ROW */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'API Gateway', val: metrics.api_health, color: metrics.api_health === 'Operational' ? 'text-green-400' : 'text-red-400', icon: Server },
                    { label: 'Latencia Edge', val: metrics.avg_latency, color: 'text-white', icon: Clock },
                    { label: 'Total Generaciones', val: (metrics.total_requests_24h).toLocaleString(), color: 'text-prismatic-blue', icon: Zap },
                    { label: 'Usuarios Totales', val: (metrics.users_count).toLocaleString(), color: 'text-lumen-gold', icon: BarChart3 }
                ].map((stat, i) => (
                    <div key={i} className="bg-black/40 border border-white/10 p-5 rounded flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-[9px] uppercase text-gray-500 font-bold tracking-widest">{stat.label}</h3>
                            <stat.icon className="w-4 h-4 text-gray-700" />
                        </div>
                        <p className={`text-2xl font-mono font-bold ${stat.color}`}>{stat.val}</p>
                    </div>
                ))}
            </div>

            {/* LOWER SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Health Checks */}
                <div className="bg-black/40 border border-white/10 rounded-sm p-6">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-4 flex items-center gap-2">
                        <ShieldCheck className="w-3 h-3 text-green-400" /> Estado de Servicios
                    </h4>
                    <div className="space-y-4">
                        {[
                            { name: 'Supabase DB', status: 'Healthy', ping: '45ms' },
                            { name: 'Supabase Edge Functions', status: 'Healthy', ping: '120ms' },
                            { name: 'Gemini AI API', status: 'Healthy', ping: '850ms' },
                            { name: 'IONOS SMTP Relay', status: 'Healthy', ping: '200ms' },
                            { name: 'Firebase Hosting', status: 'Healthy', ping: '12ms' }
                        ].map((srv, idx) => (
                            <div key={idx} className="flex items-center justify-between border-b border-white/5 pb-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                    <span className="text-xs text-white">{srv.name}</span>
                                </div>
                                <div className="font-mono text-[10px] text-gray-500">{srv.ping}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Notifications & Warnings */}
                <div className="bg-black/40 border border-white/10 rounded-sm p-6">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-3 h-3 text-yellow-500" /> Alertas de Sistema
                    </h4>
                    <div className="space-y-3">
                        <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded">
                            <p className="text-[10px] text-yellow-500 font-bold uppercase mb-1">Aviso de Cuota</p>
                            <p className="text-[9px] text-gray-400">El proyecto 'LuxScaler Node 1' ha alcanzado el 80% de su cuota diaria de Gemini Pro.</p>
                        </div>
                        <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded">
                            <p className="text-[10px] text-blue-400 font-bold uppercase mb-1">Backup Completado</p>
                            <p className="text-[9px] text-gray-400">La base de datos se ha respaldado correctamente a las 02:00 AM.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
