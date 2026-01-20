import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Package, CreditCard, RefreshCw, Loader2, DollarSign } from 'lucide-react';
import { getSupabaseClient } from '../../services/authService';

export const AdminStripe: React.FC = () => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState<any[]>([]);
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'SUBS'>('PRODUCTS');

    // Fetch Data from Edge Function
    const fetchData = async () => {
        setLoading(true);
        try {
            const supabase = getSupabaseClient();

            // 1. Fetch Products
            const resProd = await supabase.functions.invoke('stripe-manager', {
                body: { action: 'list_products' }
            });

            if (resProd.error) throw new Error(resProd.error.message);
            if (resProd.data?.data) {
                setProducts(resProd.data.data);
            }

            // 2. Fetch Subs
            const resSub = await supabase.functions.invoke('stripe-manager', {
                body: { action: 'get_subscriptions' }
            });
            if (resSub.data?.data) {
                setSubscriptions(resSub.data.data);
            }

        } catch (error) {
            console.error("Stripe Error:", error);
            // alert("Error cargando Stripe: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <div className="flex-1 flex flex-col bg-[#0A0A0F] border border-white/10 rounded-sm overflow-hidden animate-[fadeIn_0.3s]">
            {/* HEADER */}
            <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase flex items-center gap-2 text-white">
                    <CreditCard className="w-4 h-4 text-purple-400" /> Gestión de Stripe
                </h3>
                <button
                    onClick={fetchData}
                    disabled={loading}
                    className="p-2 border border-white/10 rounded hover:bg-white/10 text-white disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* TABS */}
            <div className="flex border-b border-white/10">
                <button
                    onClick={() => setActiveTab('PRODUCTS')}
                    className={`px-4 py-2 text-xs font-bold uppercase border-r border-white/10 transition-colors ${activeTab === 'PRODUCTS' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
                >
                    Productos ({products.length})
                </button>
                <button
                    onClick={() => setActiveTab('SUBS')}
                    className={`px-4 py-2 text-xs font-bold uppercase border-r border-white/10 transition-colors ${activeTab === 'SUBS' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
                >
                    Suscripciones Activas ({subscriptions.length})
                </button>
            </div>

            {/* CONTENT */}
            <div className="flex-1 overflow-y-auto p-6">

                {loading && products.length === 0 && (
                    <div className="flex justify-center p-12">
                        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                    </div>
                )}

                {!loading && activeTab === 'PRODUCTS' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {products.map((p) => (
                            <div key={p.id} className="bg-black/40 border border-white/10 p-4 rounded group hover:border-purple-500/30 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="text-sm font-bold text-white">{p.name}</h4>
                                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${p.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                        {p.active ? 'Active' : 'Archived'}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400 mb-4 line-clamp-2">{p.description}</p>

                                {p.price && (
                                    <div className="bg-white/5 p-2 rounded flex items-center justify-between">
                                        <span className="text-[10px] text-gray-500 font-mono">{p.price.id}</span>
                                        <span className="text-lg font-bold text-purple-400">
                                            ${(p.price.unit_amount / 100).toFixed(2)} <span className="text-xs text-gray-500">/ {p.price.recurring?.interval || 'one-time'}</span>
                                        </span>
                                    </div>
                                )}
                                <div className="mt-3 text-[10px] font-mono text-gray-600 truncate">I: {p.id}</div>
                            </div>
                        ))}
                    </div>
                )}

                {!loading && activeTab === 'SUBS' && (
                    <div className="space-y-2">
                        {subscriptions.map((sub) => (
                            <div key={sub.id} className="bg-black/40 border border-white/10 p-3 rounded flex justify-between items-center text-xs">
                                <div>
                                    <div className="font-bold text-white mb-0.5">{sub.customer?.email || sub.customer || 'Unknown Customer'}</div>
                                    <div className="font-mono text-gray-500">{sub.id}</div>
                                </div>
                                <div className="text-right">
                                    <div className={`font-bold uppercase ${sub.status === 'active' ? 'text-green-400' : 'text-yellow-400'}`}>{sub.status}</div>
                                    <div className="text-gray-400">Ends: {new Date(sub.current_period_end * 1000).toLocaleDateString()}</div>
                                </div>
                            </div>
                        ))}
                        {subscriptions.length === 0 && <p className="text-gray-500 italic">No active subscriptions found.</p>}
                    </div>
                )}
            </div>
        </div>
    );
};
