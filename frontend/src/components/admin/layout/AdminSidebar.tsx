import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard, Users, Megaphone, Server, Activity,
    FlaskConical, Store, Palette, LogOut, Settings,
    ChevronRight, CreditCard, Layers, Database, ChevronLeft, PanelLeftClose, PanelLeftOpen, Zap, Bot
} from 'lucide-react';
import { useTranslation } from 'react-i18next'; // Import Hook

type TabView = 'RESUMEN' | 'USUARIOS' | 'MARKETING' | 'INFRAESTRUCTURA' | 'LISTA_ESPERA' | 'REGISTRO_DATOS' | 'CONFIG_VIVA' | 'ALMACENAMIENTO' | 'LABORATORIO' | 'LUXSCALER' | 'THEME_DESIGNER' | 'STRIPE' | 'GOD_MODE' | 'LUXCANVAS';

interface AdminSidebarProps {
    currentTab: TabView;
    onTabChange: (tab: TabView) => void;
    isOpen: boolean;
    onClose: () => void;
    onLogout: () => void;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
}

// Static definition for structure, but labels will be translated in render
const MENU_STRUCTURE = [
    { id: 'RESUMEN', icon: LayoutDashboard, group: 'CORE', labelKey: 'sidebar.dashboard' },
    { id: 'USUARIOS', icon: Users, group: 'CORE', labelKey: 'sidebar.users_marketing' },
    { id: 'INFRAESTRUCTURA', icon: Server, group: 'CORE', labelKey: 'sidebar.infrastructure' },
    { id: 'ALMACENAMIENTO', icon: Database, group: 'CORE', labelKey: 'sidebar.storage' },

    { id: 'LUXSCALER', icon: Layers, group: 'APPS', labelKey: 'sidebar.luxscaler_engine' },
    { id: 'LABORATORIO', icon: FlaskConical, group: 'APPS', labelKey: 'sidebar.forensic_lab' },
    { id: 'LUXCANVAS', icon: Bot, group: 'APPS', labelKey: 'sidebar.luxcanvas' },
    { id: 'THEME_DESIGNER', icon: Palette, group: 'APPS', labelKey: 'sidebar.theme_designer' },

    { id: 'CONFIG_VIVA', icon: Settings, group: 'SYSTEM', labelKey: 'sidebar.viva_config' },
    { id: 'REGISTRO_DATOS', icon: Activity, group: 'SYSTEM', labelKey: 'sidebar.logs' },
    { id: 'STRIPE', icon: CreditCard, group: 'SYSTEM', labelKey: 'sidebar.billing' },
    { id: 'GOD_MODE', icon: Zap, group: 'SYSTEM', labelKey: 'sidebar.god_mode' },
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
    currentTab, onTabChange, isOpen, onClose, onLogout, isCollapsed, onToggleCollapse
}) => {
    const { t } = useTranslation();

    // Grouping logic with translation
    const groupedItems = MENU_STRUCTURE.reduce((acc, item) => {
        const group = item.group || 'OTHER';
        if (!acc[group]) acc[group] = [];
        acc[group].push({ ...item, label: t(item.labelKey) }); // Translate here
        return acc;
    }, {} as Record<string, any[]>);

    return (
        <>
            {/* Backdrop for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Container */}
            <div className={`fixed inset-y-0 left-0 bg-[#050505]/95 backdrop-blur-xl border-r border-white/5 z-50 transition-all duration-300 transform 
            ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} 
            ${isCollapsed ? 'lg:w-20' : 'w-full lg:w-64'} flex flex-col`}
            >

                {/* Header Logo */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-gradient-to-r from-lumen-gold/5 to-transparent">
                    <div className="flex items-center">
                        <div className="w-2 h-8 bg-lumen-gold rounded-sm mr-3 shadow-[0_0_10px_rgba(255,215,0,0.4)] animate-pulse" />
                        <h1 className={`text-lg font-black tracking-[0.2em] text-white transition-opacity duration-300 ${isCollapsed ? 'lg:opacity-0 lg:hidden' : 'opacity-100'}`}>
                            LUX<span className="text-lumen-gold">ADMIN</span>
                        </h1>
                    </div>
                    {/* Mobile Close Button */}
                    <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                </div>      {/* Navigation Scroll */}
                <div className="flex-1 overflow-y-auto py-6 space-y-8 custom-scrollbar scrollbar-none">

                    {Object.entries(groupedItems).map(([group, items]) => (
                        <div key={group} className="px-3">
                            {!isCollapsed ? (
                                <h3 className="px-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 font-mono flex items-center gap-2 whitespace-nowrap overflow-hidden">
                                    <span className="w-1 h-1 bg-gray-700 rounded-full" /> {t(`sidebar.groups.${group.toLowerCase()}`)}
                                </h3>
                            ) : (
                                <div className="h-px w-full bg-white/5 mb-3 mx-auto" />
                            )}

                            <div className="space-y-1">
                                {items.map((item: any) => {
                                    const Icon = item.icon;
                                    const isActive = currentTab === item.id;

                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => { onTabChange(item.id as TabView); onClose(); }}
                                            title={isCollapsed ? item.label : ''}
                                            className={`w-full flex items-center rounded text-xs font-medium transition-all group relative overflow-hidden
                                                ${isCollapsed ? 'justify-center p-3' : 'justify-between px-3 py-2.5'}
                                                ${isActive
                                                    ? 'bg-lumen-gold/10 text-lumen-gold border border-lumen-gold/20 shadow-[0_0_15px_-5px_rgba(255,215,0,0.3)]'
                                                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                                                }`}
                                        >
                                            {/* Hover Glow Effect */}
                                            <div className={`absolute inset-0 bg-gradient-to-r from-lumen-gold/0 via-lumen-gold/5 to-lumen-gold/0 translate-x-[-100%] transition-transform duration-500 ${!isActive && 'group-hover:translate-x-[100%]'}`} />

                                            <div className={`flex items-center relative z-10 ${isCollapsed ? 'gap-0' : 'gap-3'}`}>
                                                <Icon className={`shrink-0 ${isCollapsed ? 'w-5 h-5' : 'w-4 h-4'} ${isActive ? 'text-lumen-gold' : 'text-gray-500 group-hover:text-white'}`} />
                                                {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
                                            </div>

                                            {!isCollapsed && isActive && <ChevronRight className="w-3 h-3 text-lumen-gold animate-in slide-in-from-left-2 shrink-0" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                </div>

                {/* Footer User/Logout/Collapse */}
                <div className="p-4 border-t border-white/5 bg-black/20 flex flex-col gap-3">

                    {/* PC Collapse Toggle */}
                    <button
                        onClick={onToggleCollapse}
                        className="hidden lg:flex w-full items-center justify-center p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded transition-colors"
                        title={isCollapsed ? t('common.expand') : t('common.collapse')}
                    >
                        {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
                    </button>

                    <button
                        onClick={onLogout}
                        className={`w-full flex items-center justify-center gap-2 border border-red-500/20 rounded bg-red-500/5 text-red-400 hover:bg-red-500/10 hover:border-red-500/40 transition-all text-xs font-bold uppercase tracking-wider
                        ${isCollapsed ? 'p-2' : 'px-4 py-2'}
                        `}
                        title={isCollapsed ? t('common.logout') : ""}
                    >
                        <LogOut className="w-3 h-3" />
                        {!isCollapsed && <span>{t('common.logout')}</span>}
                    </button>

                    {!isCollapsed && (
                        <div className="text-[9px] text-gray-600 text-center font-mono whitespace-nowrap overflow-hidden">
                            v2.4.0 PRO
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};
