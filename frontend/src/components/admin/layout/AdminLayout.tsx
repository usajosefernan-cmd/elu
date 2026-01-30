import React, { useState } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { getSupabaseClient } from '../../../services/authService';
import { useEffect } from 'react';

type TabView = 'RESUMEN' | 'USUARIOS' | 'MARKETING' | 'INFRAESTRUCTURA' | 'LISTA_ESPERA' | 'REGISTRO_DATOS' | 'CONFIG_VIVA' | 'ALMACENAMIENTO' | 'LABORATORIO' | 'LUXSCALER' | 'THEME_DESIGNER' | 'STRIPE';

interface AdminLayoutProps {
    currentTab: TabView;
    onTabChange: (tab: TabView) => void;
    children: React.ReactNode;
    userEmail?: string;
    onLogout: () => void;
    standAloneMode?: boolean;
    onExit?: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ 
    currentTab, 
    onTabChange, 
    children, 
    userEmail, 
    onLogout, 
    standAloneMode = false,
    onExit
}) => {
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('LUX_ADMIN_SIDEBAR_COLLAPSED') === 'true';
        }
        return false;
    });

    const toggleCollapse = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem('LUX_ADMIN_SIDEBAR_COLLAPSED', String(newState));
    };

    // Get Title based on Tab
    const getTitle = (tab: TabView) => {
        const titles: Record<TabView, string> = {
            'RESUMEN': 'Dashboard General',
            'USUARIOS': 'Gestión de Usuarios',
            'MARKETING': 'Comunicaciones & Campañas',
            'INFRAESTRUCTURA': 'Estado del Sistema',
            'LISTA_ESPERA': 'Waitlist & Beta',
            'REGISTRO_DATOS': 'Historial de Generaciones',
            'CONFIG_VIVA': 'Configuración del Sistema',
            'ALMACENAMIENTO': 'Gestor de Archivos (Storage)',
            'LABORATORIO': 'Forensic Image Lab',
            'LUXSCALER': 'LuxScaler™ Image Engine',
            'THEME_DESIGNER': 'Theme Studio',
            'STRIPE': 'Facturación & Pagos'
        };
        return titles[tab] || 'Administración';
    };

    if (standAloneMode) {
        return (
            <div className="min-h-screen bg-[#020202] text-white font-sans selection:bg-lumen-gold/30 selection:text-lumen-gold flex flex-col">
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-black p-0 custom-scrollbar relative">
                    {children}
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#020202] text-white font-sans flex overflow-hidden selection:bg-lumen-gold/30 selection:text-lumen-gold">

            {/* Sidebar */}
            <AdminSidebar
                currentTab={currentTab}
                onTabChange={onTabChange}
                isOpen={isMobileOpen}
                onClose={() => setIsMobileOpen(false)}
                onLogout={onLogout}
                isCollapsed={isCollapsed}
                onToggleCollapse={toggleCollapse}
                onExit={onExit}
            />

            {/* Main Content Wrapper */}
            <div className={`flex-1 flex flex-col min-w-0 h-screen transition-all duration-300 ${isCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>

                {/* Header */}
                <AdminHeader
                    title={getTitle(currentTab)}
                    userEmail={userEmail}
                    onMenuClick={() => setIsMobileOpen(true)}
                    onExit={onExit}
                />

                {/* Content Area - Scrollable */}
                {/* [MOD LUXCANVAS] Disable global scroll for LuxCanvas to fix chat jump issues */}
                <main className={`flex-1 bg-black/50 p-4 lg:p-6 custom-scrollbar relative ${currentTab === 'LUXCANVAS' ? 'overflow-hidden p-0 lg:p-0' : 'overflow-x-hidden overflow-y-auto'}`}>

                    {/* Optional: Background ambient glow */}
                    <div className="fixed top-0 left-0 w-full h-[500px] bg-lumen-gold/5 rounded-full blur-[150px] pointer-events-none -z-10 opacity-30 mix-blend-screen" />

                    <div className="w-full h-full flex flex-col">
                        {children}
                    </div>
                </main>

            </div>
        </div>
    );
};
