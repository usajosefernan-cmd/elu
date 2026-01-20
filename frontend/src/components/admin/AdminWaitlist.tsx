import React, { useState, useEffect } from 'react';
import { getSupabaseClient } from '../../services/authService';
import { Ticket, Check, X, Key, RefreshCw } from 'lucide-react';

export const AdminWaitlist: React.FC = () => {
    const [waitlist, setWaitlist] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const supabase = getSupabaseClient();

    const fetchWaitlist = async () => {
        setLoading(true);
        const { data } = await supabase.from('beta_waitlist')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });
        if (data) setWaitlist(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchWaitlist();
    }, []);

    const handleApprove = async (entry: any) => {
        // Generate unique code
        const code = `LUX-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        const tokensBonus = 100; // Default bonus

        // Update waitlist entry
        const { error } = await supabase.from('beta_waitlist').update({
            status: 'approved',
            access_code: code,
            tokens_bonus: tokensBonus,
            approved_at: new Date().toISOString()
        }).eq('id', entry.id);

        if (error) {
            alert('Error: ' + error.message);
        } else {
            // Copy code to clipboard
            navigator.clipboard.writeText(code);
            alert(`Código generado: ${code}\n\nCopiado al portapapeles. Enviar a: ${entry.email}\nBonus: ${tokensBonus} Tokens`);
            fetchWaitlist();
        }
    };

    const handleReject = async (id: string) => {
        if (!confirm('¿Rechazar esta solicitud?')) return;
        await supabase.from('beta_waitlist').update({ status: 'rejected' }).eq('id', id);
        fetchWaitlist();
    };

    const showApprovedCodes = async () => {
        const { data } = await supabase.from('beta_waitlist')
            .select('*')
            .eq('status', 'approved')
            .order('approved_at', { ascending: false })
            .limit(50);
        if (data && data.length > 0) {
            const text = data.map((d: any) => `${d.email} | ${d.access_code} | ${d.tokens_bonus} Tokens`).join('\n');
            alert("CÓDIGOS APROBADOS (Top 50):\n\n" + text);
        } else {
            alert('No hay códigos generados aún.');
        }
    };

    return (
        <div className="flex-1 overflow-y-auto bg-transparent p-6 animate-[fadeIn_0.3s]">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-lumen-gold" /> Solicitudes Pendientes
                </h3>
                <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-500 font-mono">{waitlist.length} pendientes</span>
                    <button onClick={fetchWaitlist} className="p-1.5 hover:bg-white/10 rounded">
                        <RefreshCw className={`w-3 h-3 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {waitlist.length === 0 ? (
                <div className="text-center py-12 border border-white/5 rounded-sm bg-white/5">
                    <Ticket className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                    <p className="text-gray-500 text-sm">No hay solicitudes pendientes</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {waitlist.map((entry: any) => (
                        <div key={entry.id} className="bg-black/40 border border-white/10 rounded-sm p-4 flex flex-col md:flex-row md:items-center gap-4">
                            <div className="flex-1">
                                <p className="text-white font-bold text-sm">{entry.name || 'Sin nombre'}</p>
                                <p className="text-gray-400 text-xs font-mono">{entry.email}</p>
                                <p className="text-[10px] text-gray-600 mt-1">
                                    {new Date(entry.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleApprove(entry)}
                                    className="px-4 py-2 bg-green-500/10 border border-green-500/30 text-green-400 text-[10px] uppercase font-bold rounded hover:bg-green-500/20 transition-colors flex items-center gap-1"
                                >
                                    <Check className="w-3 h-3" /> Aprobar + Código
                                </button>
                                <button
                                    onClick={() => handleReject(entry.id)}
                                    className="px-3 py-2 bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] uppercase font-bold rounded hover:bg-red-500/20 transition-colors"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* APPROVED USERS SECTION */}
            <div className="mt-8 pt-6 border-t border-white/10">
                <div className="bg-white/5 border border-white/5 p-4 rounded-sm flex items-center justify-between">
                    <h4 className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2">
                        <Key className="w-3 h-3" /> Gestión de Códigos & Accesos
                    </h4>
                    <button
                        onClick={showApprovedCodes}
                        className="text-[10px] bg-black border border-white/20 px-3 py-1.5 rounded text-lumen-gold hover:bg-white/10 transition-all font-bold uppercase"
                    >
                        Ver Historial de Códigos
                    </button>
                </div>
            </div>
        </div>
    );
};
