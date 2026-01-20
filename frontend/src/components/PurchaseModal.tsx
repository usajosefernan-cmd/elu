
import React, { useState } from 'react';
import { simulatePurchase } from '../services/paymentService';
import { X, Zap, Crown, Gem, Star, CheckCircle, CreditCard, Loader2 } from 'lucide-react';

// TOKEN COSTS
// Preview: 1 token
// Master 4K: 5 tokens
// Master 8K: 10 tokens

interface PurchaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const PurchaseModal: React.FC<PurchaseModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [isLoading, setIsLoading] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'packs' | 'subs'>('packs');

    if (!isOpen) return null;

    const handleBuy = async (packId: string) => {
        setIsLoading(packId);
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            await simulatePurchase(packId);
            onSuccess();
            onClose();
            alert("¡Pago completado! Tokens añadidos.");
        } catch (error) {
            alert("Error en la transacción.");
        } finally {
            setIsLoading(null);
        }
    };

    const PackCard = ({ id, name, tokens, price, icon: Icon, features, popular }: any) => (
        <div className={`relative p-5 border rounded-xl flex flex-col gap-3 transition-all duration-300 ${popular ? 'bg-lumen-gold/5 border-lumen-gold/40 shadow-[0_0_20px_rgba(230,199,139,0.1)]' : 'bg-white/5 border-white/10 hover:border-white/30'}`}>
            {popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-lumen-gold text-black text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                    Best Value
                </div>
            )}
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest">{name}</h3>
                    <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-2xl font-black text-white">{tokens}</span>
                        <span className="text-xs text-lumen-gold font-bold">tokens</span>
                    </div>
                </div>
                <Icon className={`w-5 h-5 ${popular ? 'text-lumen-gold' : 'text-gray-500'}`} />
            </div>

            <div className="space-y-1.5 py-3 border-t border-b border-white/5">
                {features.map((feat: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-[10px] text-gray-400">
                        <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" /> {feat}
                    </div>
                ))}
            </div>

            <button
                onClick={() => handleBuy(id)}
                disabled={!!isLoading}
                className={`w-full py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${popular
                    ? 'bg-lumen-gold text-black hover:bg-white hover:shadow-lg'
                    : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
            >
                {isLoading === id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CreditCard className="w-4 h-4" /> {price}</>}
            </button>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-void-black/95 backdrop-blur-md" onClick={onClose}></div>
            <div className="relative w-full max-w-3xl bg-void-black border border-white/10 rounded-xl shadow-2xl p-6 animate-[fadeIn_0.3s_ease-out] overflow-y-auto max-h-[90vh]">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                    <X className="w-5 h-5" />
                </button>

                <div className="text-center mb-4">
                    <h2 className="text-xl font-black text-white mb-1">Comprar Tokens</h2>
                    <p className="text-xs text-gray-400">Sin suscripción obligatoria. Los tokens no caducan.</p>
                </div>

                {/* TABS */}
                <div className="flex justify-center gap-2 mb-6">
                    <button
                        onClick={() => setActiveTab('packs')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase ${activeTab === 'packs' ? 'bg-lumen-gold text-black' : 'bg-white/10 text-gray-400'}`}
                    >
                        Paquetes
                    </button>
                    <button
                        onClick={() => setActiveTab('subs')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase ${activeTab === 'subs' ? 'bg-lumen-gold text-black' : 'bg-white/10 text-gray-400'}`}
                    >
                        Suscripciones
                    </button>
                </div>

                {/* PRICING INFO */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-3 mb-5 text-center">
                    <div className="flex justify-center gap-6 flex-wrap text-xs">
                        <span className="text-gray-400">Preview: <span className="text-white font-bold">10 tokens</span></span>
                        <span className="text-gray-400">4K: <span className="text-lumen-gold font-bold">50 tokens</span></span>
                        <span className="text-gray-400">8K: <span className="text-white font-bold">100 tokens</span></span>
                    </div>
                </div>

                {activeTab === 'packs' ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <PackCard
                            id="try"
                            name="Try"
                            tokens={30}
                            price="€3"
                            icon={Zap}
                            features={["3 previews", "Para probar"]}
                        />
                        <PackCard
                            id="basic"
                            name="Basic"
                            tokens={100}
                            price="€9"
                            icon={Star}
                            features={["10 previews", "2 masters 4K", "1 master 8K"]}
                        />
                        <PackCard
                            id="plus"
                            name="Plus"
                            tokens={250}
                            price="€19"
                            icon={Gem}
                            popular={true}
                            features={["25 previews", "5 masters 4K", "2 masters 8K"]}
                        />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <PackCard
                            id="lite"
                            name="Lite"
                            tokens="150/mes"
                            price="€12/mes"
                            icon={Zap}
                            features={["150 tokens mensuales", "Ahorro 20%", "Cola prioritaria"]}
                        />
                        <PackCard
                            id="pro"
                            name="Pro"
                            tokens="400/mes"
                            price="€29/mes"
                            icon={Gem}
                            popular={true}
                            features={["400 tokens mensuales", "Ahorro 28%", "Cola prioritaria", "Soporte email"]}
                        />
                        <PackCard
                            id="studio"
                            name="Studio"
                            tokens="1000/mes"
                            price="€59/mes"
                            icon={Crown}
                            features={["1000 tokens mensuales", "Ahorro 41%", "Cola VIP", "Soporte prioritario"]}
                        />
                    </div>
                )}

                <div className="mt-5 text-center">
                    <p className="text-[10px] text-gray-500">
                        Pago seguro con Stripe. Entorno en <span className="text-lumen-gold">Sandbox</span> (sin cargos reales).
                    </p>
                </div>
            </div>
        </div>
    );
};
