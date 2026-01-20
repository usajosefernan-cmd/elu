import React from 'react';
import { Bell, Search, Menu, User, Shield } from 'lucide-react';

interface AdminHeaderProps {
    onMenuClick: () => void;
    userEmail: string | undefined;
    title: string;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onMenuClick, userEmail, title }) => {
    return (
        <header className="h-16 flex items-center justify-between px-4 lg:px-8 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md sticky top-0 z-30">

            {/* Left: Menu & Breadcrumb */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="p-2 -ml-2 text-gray-400 hover:text-white lg:hidden"
                >
                    <Menu className="w-5 h-5" />
                </button>

                <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest hidden md:block">
                        LUXSCALER / ADMINISTRACIÓN
                    </span>
                    <h2 className="text-sm md:text-base font-bold text-white flex items-center gap-2">
                        {title}
                        <span className="px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-[9px] text-blue-400 font-mono">PRO</span>
                    </h2>
                </div>
            </div>

            {/* Right: Actions & Profile */}
            <div className="flex items-center gap-3 md:gap-6">

                {/* Fast Search (Visual Only) */}
                <div className="hidden md:flex items-center px-3 py-1.5 bg-white/5 border border-white/10 rounded-full w-64 focus-within:border-lumen-gold/50 transition-colors">
                    <Search className="w-3 h-3 text-gray-500 mr-2" />
                    <input
                        type="text"
                        placeholder="Buscar..."
                        className="bg-transparent border-none outline-none text-xs text-white placeholder-gray-600 w-full"
                    />
                    <span className="text-[9px] text-gray-700 font-mono border border-gray-800 rounded px-1">Ctrl+K</span>
                </div>

                <div className="h-6 w-px bg-white/10 mx-1 hidden md:block" />

                {/* Notifications */}
                <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
                    <Bell className="w-4 h-4" />
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                </button>

                {/* Profile Pill */}
                <div className="flex items-center gap-3 pl-3 py-1 pr-1 rounded-full border border-white/5 bg-white/5 hover:bg-white/10 transition-all cursor-pointer group">
                    <div className="flex flex-col text-right hidden lg:flex">
                        <span className="text-xs font-bold text-white group-hover:text-lumen-gold transition-colors">
                            {userEmail?.split('@')[0] || 'Admin'}
                        </span>
                        <span className="text-[9px] text-gray-500 font-mono">SUPER ADMIN</span>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-800 to-black border border-white/10 flex items-center justify-center shadow-lg">
                        <Shield className="w-3 h-3 text-lumen-gold" />
                    </div>
                </div>

            </div>
        </header>
    );
};
