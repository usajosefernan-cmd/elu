import React, { useState } from 'react';
import { BackgroundBeams } from './ui/BackgroundBeams';
import { GlowingBorder } from './ui/GlowingBorder';
import { Check, ArrowRight, Zap, Code, Building2, Terminal, Sparkles, Database } from 'lucide-react';

interface PricingPageProps {
    onBack: () => void;
}

const SHOWCASE_BASE = "https://pjscnzymofaijevonxkm.supabase.co/storage/v1/object/public/lux-storage/webasset/landing";

export const PricingPage: React.FC<PricingPageProps> = ({ onBack }) => {
    const [viewMode, setViewMode] = useState<'consumer' | 'api'>('consumer');
    const [billingCycle, setBillingCycle] = useState<'once' | 'monthly' | 'annual'>('once');
    const [hoveredCard, setHoveredCard] = useState<number | null>(null);

    const renderCardContent = (plan: PricingPlan, mode: 'consumer' | 'api') => (
        <div className="relative h-full p-8 flex flex-col z-10">
            {/* GRADIENT OVERLAY (for non-glowing cards or inner glow) */}
            {plan.featured && (
                <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${mode === 'api' ? 'from-transparent via-blue-500 to-transparent' : 'from-transparent via-lumen-gold to-transparent'
                    }`} />
            )}

            {/* HEADER */}
            <div className="mb-8">
                <h3 className={`text-xl font-bold mb-2 ${plan.featured
                    ? mode === 'api' ? 'text-blue-400' : 'text-lumen-gold'
                    : 'text-white'
                    }`}>
                    {plan.tier}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">{plan.description}</p>
            </div>

            {/* PRICE */}
            <div className="mb-8">
                <div className="flex items-baseline gap-1">
                    <span className="text-gray-500 text-lg font-light">€</span>
                    <span className="text-5xl font-black text-white tracking-tight">{plan.price}</span>
                    {plan.period && <span className="text-gray-500 text-sm">{plan.period}</span>}
                </div>

                <div className="flex items-center justify-between mt-4 pb-4 border-b border-white/5">
                    <span className={`text-sm font-bold ${mode === 'api' ? 'text-blue-200' : 'text-lumen-gold'
                        }`}>
                        {plan.tokens} tokens
                    </span>
                    {mode === 'api' && plan.cpp && (
                        <span className="text-xs font-mono text-gray-500 bg-white/5 px-2 py-1 rounded">
                            €{plan.cpp} / req
                        </span>
                    )}
                </div>
            </div>

            {/* FEATURES */}
            <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-3 text-sm group-hover:translate-x-1 transition-transform duration-300">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${plan.featured
                            ? mode === 'api' ? 'bg-blue-500/10' : 'bg-lumen-gold/10'
                            : 'bg-white/5'
                            }`}>
                            <Check className={`w-3 h-3 ${plan.featured
                                ? mode === 'api' ? 'text-blue-500' : 'text-lumen-gold'
                                : 'text-gray-600'
                                }`} />
                        </div>
                        <span className="text-gray-400">{f}</span>
                    </li>
                ))}
            </ul>

            {/* CTA */}
            <button className={`w-full py-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${plan.featured
                ? mode === 'api'
                    ? 'bg-blue-600 text-white hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-900/40'
                    : 'bg-lumen-gold text-black hover:bg-white hover:shadow-lg hover:shadow-lumen-gold/20'
                : 'bg-white/5 text-white hover:bg-white/10'
                }`}>
                {mode === 'api' ? 'Generate Key' : 'Purchase'}
                <ArrowRight className="w-4 h-4" />
            </button>
        </div>
    );

    return (
        <div className={`relative w-full min-h-screen transition-colors duration-700 ${viewMode === 'api' ? 'bg-[#0B0F19]' : 'bg-black'
            }`}>

            {/* BACKGROUND SHOWCASE IMAGES (Subtle) & BEAMS */}
            <div className="absolute inset-0 h-[30vh] md:h-[50vh] overflow-hidden pointer-events-none">
                <BackgroundBeams className="opacity-40" />
                <div className={`absolute inset-0 bg-gradient-to-b ${viewMode === 'api'
                    ? 'from-[#0B0F19]/80 via-[#0B0F19] to-[#0B0F19]'
                    : 'from-black/80 via-black to-black'
                    }`} />
            </div>

            {/* MAIN CONTENT CONTAINER */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-8 flex flex-col items-center">

                {/* 1. MAJOR MODE SWITCHER (Verified Compact) */}
                <div className="mb-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-full p-1 inline-flex items-center shadow-lg">
                    <button
                        onClick={() => setViewMode('consumer')}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${viewMode === 'consumer'
                            ? 'bg-white text-black shadow-sm'
                            : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        <Sparkles className="w-3 h-3" />
                        <span className="hidden md:inline">Creative Studio</span>
                        <span className="md:hidden">Creative</span>
                    </button>
                    <button
                        onClick={() => setViewMode('api')}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${viewMode === 'api'
                            ? 'bg-blue-500 text-white shadow-sm'
                            : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        <Code className="w-3 h-3" />
                        <span className="hidden md:inline">API Platform</span>
                        <span className="md:hidden">API</span>
                    </button>
                </div>

                {/* 2. SPECIFIC CONTROLS */}
                {viewMode === 'consumer' ? (
                    <div className="flex justify-center mb-8 animate-[fadeIn_0.5s]">
                        <div className="relative inline-flex bg-white/5 border border-white/10 rounded-lg md:rounded-full p-1">
                            {(['once', 'monthly', 'annual'] as const).map((cycle) => (
                                <button
                                    key={cycle}
                                    onClick={() => setBillingCycle(cycle)}
                                    className={`relative px-4 py-1.5 rounded-md md:rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all duration-300 ${billingCycle === cycle
                                        ? 'text-black'
                                        : 'text-gray-500 hover:text-white'
                                        }`}
                                >
                                    {billingCycle === cycle && (
                                        <span className="absolute inset-0 bg-lumen-gold/90 rounded-md md:rounded-full animate-[fadeIn_0.3s] shadow-[0_0_15px_rgba(212,175,55,0.4)]" />
                                    )}
                                    <span className="relative z-10">
                                        {cycle === 'once' ? 'One-Time' : cycle}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-center mb-8 animate-[fadeIn_0.5s]">
                        <div className="flex gap-8 text-center px-4 py-2 border border-blue-500/20 rounded-xl bg-blue-500/5">
                            <div>
                                <p className="text-lg font-black text-blue-400">99.9%</p>
                                <p className="text-[9px] text-blue-400/50 uppercase tracking-widest font-mono">Uptime</p>
                            </div>
                            <div className="w-px bg-blue-500/20"></div>
                            <div>
                                <p className="text-lg font-black text-blue-400">50ms</p>
                                <p className="text-[9px] text-blue-400/50 uppercase tracking-widest font-mono">Latency</p>
                            </div>
                            <div className="w-px bg-blue-500/20"></div>
                            <div>
                                <p className="text-lg font-black text-blue-400">REST</p>
                                <p className="text-[9px] text-blue-400/50 uppercase tracking-widest font-mono">API</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. PRICING CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl">
                    {(viewMode === 'consumer' ? getConsumerData(billingCycle) : getApiData()).map((plan, i) => (
                        <div
                            key={plan.tier}
                            onMouseEnter={() => setHoveredCard(i)}
                            onMouseLeave={() => setHoveredCard(null)}
                            className={`relative group transition-all duration-500 ${plan.featured ? 'md:-mt-6 md:mb-6 md:scale-105 z-10' : 'z-0'}`}
                        >
                            {plan.featured ? (
                                <GlowingBorder
                                    gradientFrom={viewMode === 'api' ? '#3B82F6' : '#D4AF37'}
                                    gradientTo={viewMode === 'api' ? '#60A5FA' : '#FCD34D'}
                                    className={viewMode === 'api' ? 'bg-[#111827]' : 'bg-[#121212]'}
                                >
                                    {renderCardContent(plan, viewMode)}
                                </GlowingBorder>
                            ) : (
                                <div className={`h-full rounded-2xl overflow-hidden transition-all duration-300 p-[1px] ${viewMode === 'api'
                                    ? 'bg-gradient-to-b from-white/10 to-transparent hover:from-blue-500/50'
                                    : 'bg-gradient-to-b from-white/10 to-transparent hover:from-white/20'
                                    }`}>
                                    <div className={viewMode === 'api' ? 'bg-[#0F141F] h-full rounded-2xl' : 'bg-black/40 h-full rounded-2xl'}>
                                        {renderCardContent(plan, viewMode)}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* BOTTOM NOTE */}
                <div className="mt-16 text-center animate-[fadeIn_1s]">
                    {viewMode === 'consumer' ? (
                        <p className="text-white/20 text-sm font-light">
                            All plans include access to standard presets • Secure Stripe checkout
                        </p>
                    ) : (
                        <div className="flex items-center gap-2 text-blue-400/40 text-sm font-mono p-2 border border-blue-500/10 rounded bg-blue-500/5 cursor-pointer hover:bg-blue-500/10 transition-colors">
                            <Terminal className="w-4 h-4" />
                            <span>curl -X POST https://api.luxscaler.io/v1/enhance</span>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

// --- DATA HELPERS ---

interface PricingPlan {
    tier: string;
    price: string;
    tokens: string;
    description: string;
    features: string[];
    featured?: boolean;
    period?: string;
    cpp?: string;
}

const getConsumerData = (cycle: 'once' | 'monthly' | 'annual'): PricingPlan[] => {
    if (cycle === 'once') {
        return [
            { tier: 'Starter', price: '3', tokens: '30', description: 'Just trying things out.', features: ['3 AI Previews', 'Tokens never expire', 'Access to all styles'] },
            { tier: 'Professional', price: '9', tokens: '100', description: 'Most popular for creators.', features: ['10 AI Previews', 'Or 2 Master 4K Exports', 'Priority processing'], featured: true },
            { tier: 'Studio', price: '19', tokens: '250', description: 'Maximum project value.', features: ['25 AI Previews', 'Or 5 Master 4K Exports', 'Priority processing', 'Commercial usage'] },
        ];
    }
    if (cycle === 'monthly') {
        return [
            { tier: 'Lite', price: '12', period: '/mo', tokens: '150', description: 'Consistent content.', features: ['15 Previews / month', 'Priority queue', 'Email support'] },
            { tier: 'Pro', price: '29', period: '/mo', tokens: '400', description: 'Power user access.', features: ['40 Previews / month', 'VIP queue', 'Priority support', 'Early access features'], featured: true },
            { tier: 'Expert', price: '59', period: '/mo', tokens: '1000', description: 'Agency output.', features: ['100 Previews / month', 'Instant processing', 'Dedicated support', 'Commercial license'] },
        ];
    }
    // Annual
    return [
        { tier: 'Lite', price: '99', period: '/yr', tokens: '150/mo', description: '2 months free.', features: ['15 Previews / month', 'Priority queue', 'Email support'] },
        { tier: 'Pro', price: '249', period: '/yr', tokens: '400/mo', description: 'Best value year-round.', features: ['40 Previews / month', 'VIP queue', 'Priority support'], featured: true },
        { tier: 'Expert', price: '499', period: '/yr', tokens: '1000/mo', description: 'Production ready.', features: ['100 Previews / month', 'Instant processing', 'Dedicated support'] },
    ];
};

const getApiData = (): PricingPlan[] => {
    return [
        {
            tier: 'API Build',
            price: '49',
            period: '/mo',
            tokens: '2,500',
            cpp: '0.20',
            description: 'Startups & MVP integration.',
            features: [
                '2,500 API Credits',
                'REST API Access',
                'Webhooks Support',
                'Standard Docs'
            ]
        },
        {
            tier: 'API Scale',
            price: '149',
            period: '/mo',
            tokens: '10,000',
            cpp: '0.15',
            description: 'Growing platforms.',
            features: [
                '10,000 API Credits',
                'Priority Processing',
                '99.9% Uptime SLA',
                'Dedicated Support'
            ],
            featured: true
        },
        {
            tier: 'Enterprise',
            price: '399',
            period: '/mo',
            tokens: '40,000',
            cpp: '0.10',
            description: 'High volume pipelines.',
            features: [
                '40,000 API Credits',
                'Lowest cost per req',
                'Custom Rate Limits',
                'Direct Engineer Access'
            ]
        },
    ];
};
