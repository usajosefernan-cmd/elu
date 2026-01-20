
import React, { useState, useEffect } from 'react';
import { getSupabaseClient } from '../../services/authService';
import {
    Mail, Send, Settings, Eye, Clock, List, Layout,
    Zap, Save, RefreshCw, Check, AlertTriangle, Code, Smartphone
} from 'lucide-react';

export const AdminMarketing: React.FC = () => {
    const [activeSection, setActiveSection] = useState<'NEWSLETTER' | 'AUTOMATION' | 'HISTORY' | 'CONFIG'>('NEWSLETTER');
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState<any>({
        automation_welcome_enabled: 'false',
        welcome_email_subject: '',
        welcome_email_html: ''
    });

    const supabase = getSupabaseClient();

    const fetchSettings = async () => {
        setLoading(true);
        const { data } = await supabase.from('system_settings').select('*');
        if (data) {
            const newSettings: any = {};
            data.forEach(s => {
                newSettings[s.key] = s.value;
            });
            setSettings(newSettings);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const saveSettings = async () => {
        setLoading(true);
        const updates = Object.entries(settings).map(([key, value]) => ({
            key, value: value as string, updated_at: new Date().toISOString()
        }));

        const { error } = await supabase.from('system_settings').upsert(updates);
        if (error) alert('Error guardando config: ' + error.message);
        else alert('Configuración de marketing guardada');
        setLoading(false);
    };

    const handleTestConnection = async () => {
        if (!settings.smtp_host || !settings.smtp_user || !settings.smtp_pass) {
            alert('Por favor complete Host, Usuario y Contraseña para probar.');
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('send-email-custom', {
                body: {
                    action: 'test_connection',
                    payload: {
                        host: settings.smtp_host,
                        port: settings.smtp_port,
                        user: settings.smtp_user,
                        pass: settings.smtp_pass,
                        secure: settings.smtp_port === 465,
                    }
                }
            });

            if (error) throw error;

            alert('✅ ÉXITO: ' + data.message);
        } catch (err: any) {
            console.error('Error testing connection:', err);
            alert('❌ ERROR DE CONEXIÓN: ' + (err.message || JSON.stringify(err)));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full animate-[fadeIn_0.3s]">
            {/* Nav Tabs */}
            <div className="flex border-b border-white/10 bg-white/5 px-4 overflow-x-auto no-scrollbar">
                {[
                    { id: 'NEWSLETTER', icon: Mail, label: 'Newsletter' },
                    { id: 'AUTOMATION', icon: Zap, label: 'Automatización' },
                    { id: 'HISTORY', icon: Clock, label: 'Historial / Métricas' },
                    { id: 'CONFIG', icon: Settings, label: 'Configuración SMTP' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveSection(tab.id as any)}
                        className={`flex items-center gap-2 px-6 py-4 text-[10px] font-bold uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${activeSection === tab.id
                            ? 'border-lumen-gold text-white bg-white/5'
                            : 'border-transparent text-gray-500 hover:text-white'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-transparent">
                {activeSection === 'NEWSLETTER' && (
                    <div className="max-w-4xl mx-auto space-y-6">
                        <div className="flex justify-between items-center bg-black/40 border border-white/10 p-4 rounded">
                            <div>
                                <h3 className="text-white font-bold text-sm">Crear Nueva Campaña</h3>
                                <p className="text-[10px] text-gray-500">Envío masivo a segmentos de usuarios.</p>
                            </div>
                            <button className="px-6 py-2 bg-lumen-gold text-black font-bold text-[10px] uppercase rounded hover:bg-white transition-all flex items-center gap-2">
                                <Send className="w-3 h-3" /> Lanzar Campaña
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Asunto</label>
                                <input
                                    type="text"
                                    className="w-full bg-black border border-white/10 rounded p-2 text-xs text-white focus:border-lumen-gold outline-none"
                                    placeholder="Ej: ¡Nuevos estilos LuxScaler disponibles!"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Contenido (HTML / MJML)</label>
                                <textarea
                                    className="w-full bg-black border border-white/10 rounded p-4 text-xs font-mono text-gray-300 min-h-[400px] focus:border-lumen-gold outline-none"
                                    placeholder="<html>...</html>"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {activeSection === 'AUTOMATION' && (
                    <div className="max-w-4xl mx-auto space-y-8">
                        {/* Welcome Email Auto */}
                        <div className="bg-black/40 border border-white/10 p-6 rounded-sm">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-white font-bold text-base flex items-center gap-2">
                                        <Zap className="w-5 h-5 text-lumen-gold" /> Bienvenida de Waitlist
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-1">Automatiza el envío del mail de confirmación cuando alguien se inscribe.</p>
                                </div>
                                <div className="flex items-center gap-3 bg-black/50 p-2 rounded-full border border-white/10">
                                    <span className="text-[9px] font-bold uppercase text-gray-400">Estado:</span>
                                    <button
                                        onClick={() => setSettings({ ...settings, automation_welcome_enabled: settings.automation_welcome_enabled === 'true' ? 'false' : 'true' })}
                                        className={`w-10 h-5 rounded-full relative transition-colors ${settings.automation_welcome_enabled === 'true' ? 'bg-green-500' : 'bg-gray-700'}`}
                                    >
                                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${settings.automation_welcome_enabled === 'true' ? 'left-6' : 'left-1'}`} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Asunto del Email</label>
                                    <input
                                        type="text"
                                        value={settings.welcome_email_subject}
                                        onChange={(e) => setSettings({ ...settings, welcome_email_subject: e.target.value })}
                                        className="w-full bg-black border border-white/10 rounded p-3 text-xs text-white focus:border-lumen-gold outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2 flex justify-between">
                                            <span>Editor HTML / Código</span>
                                            <Code className="w-3 h-3" />
                                        </label>
                                        <textarea
                                            value={settings.welcome_email_html}
                                            onChange={(e) => setSettings({ ...settings, welcome_email_html: e.target.value })}
                                            className="w-full bg-[#050505] border border-white/10 rounded p-4 text-[10px] font-mono text-lumen-gold min-h-[500px] focus:border-lumen-gold outline-none custom-scrollbar"
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2 flex justify-between">
                                            <span>Vista Previa (Desktop/Móvil)</span>
                                            <Smartphone className="w-3 h-3" />
                                        </label>
                                        <div className="flex-1 bg-white rounded overflow-hidden border border-white/10 relative">
                                            {/* Dummy browser/mail frame */}
                                            <div className="absolute top-0 left-0 right-0 h-8 bg-gray-100 border-b border-gray-200 flex items-center px-3 gap-1">
                                                <div className="w-2 h-2 rounded-full bg-red-400" />
                                                <div className="w-2 h-2 rounded-full bg-yellow-400" />
                                                <div className="w-2 h-2 rounded-full bg-green-400" />
                                            </div>
                                            <iframe
                                                title="Preview"
                                                srcDoc={settings.welcome_email_html}
                                                className="w-full h-full pt-8 border-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                                    <button
                                        onClick={() => alert("Simulando envío de prueba a tu email...")}
                                        className="flex items-center gap-2 px-4 py-2 border border-white/10 rounded text-[10px] uppercase font-bold hover:bg-white/5 transition-all text-gray-300"
                                    >
                                        <Send className="w-3 h-3" /> Probar Email
                                    </button>
                                    <button
                                        onClick={saveSettings}
                                        disabled={loading}
                                        className="flex items-center gap-2 px-6 py-2 bg-lumen-gold text-black rounded font-bold text-[10px] uppercase hover:bg-white transition-all disabled:opacity-50"
                                    >
                                        {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Guardar Automatización
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* SMTP CONFIGURATION TAB */}
                {activeSection === 'CONFIG' && (
                    <div className="max-w-2xl mx-auto space-y-6">
                        <div className="bg-black/40 border border-white/10 p-6 rounded-sm">
                            <h3 className="text-white font-bold text-base mb-4 flex items-center gap-2">
                                <Settings className="w-5 h-5 text-lumen-gold" /> Configuración SMTP Personalizada
                            </h3>
                            <p className="text-xs text-gray-500 mb-6">
                                Configura tu propio servidor de correo para enviar las campañas sin los límites de Supabase.
                                Las credenciales se guardan encriptadas en `system_settings`.
                            </p>

                            <div className="grid grid-cols-1 gap-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Host SMTP</label>
                                        <input
                                            type="text"
                                            placeholder="smtp.gmail.com"
                                            value={settings.smtp_host || ''}
                                            onChange={(e) => setSettings({ ...settings, smtp_host: e.target.value })}
                                            className="w-full bg-black border border-white/10 rounded p-2 text-xs text-white focus:border-lumen-gold outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Puerto</label>
                                        <input
                                            type="number"
                                            placeholder="587"
                                            value={settings.smtp_port || ''}
                                            onChange={(e) => setSettings({ ...settings, smtp_port: e.target.value })}
                                            className="w-full bg-black border border-white/10 rounded p-2 text-xs text-white focus:border-lumen-gold outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Usuario / Email</label>
                                    <input
                                        type="text"
                                        placeholder="tu_email@dominio.com"
                                        value={settings.smtp_user || ''}
                                        onChange={(e) => setSettings({ ...settings, smtp_user: e.target.value })}
                                        className="w-full bg-black border border-white/10 rounded p-2 text-xs text-white focus:border-lumen-gold outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Contraseña / App Password</label>
                                    <input
                                        type="password"
                                        placeholder="••••••••••••"
                                        value={settings.smtp_pass || ''}
                                        onChange={(e) => setSettings({ ...settings, smtp_pass: e.target.value })}
                                        className="w-full bg-black border border-white/10 rounded p-2 text-xs text-white focus:border-lumen-gold outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Remitente (From Name)</label>
                                    <input
                                        type="text"
                                        placeholder="LuxScaler Team"
                                        value={settings.smtp_from_name || ''}
                                        onChange={(e) => setSettings({ ...settings, smtp_from_name: e.target.value })}
                                        className="w-full bg-black border border-white/10 rounded p-2 text-xs text-white focus:border-lumen-gold outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-white/5">
                                <button
                                    onClick={handleTestConnection}
                                    disabled={loading}
                                    className="px-4 py-2 border border-white/10 text-white text-[10px] uppercase font-bold rounded hover:bg-white/5 disabled:opacity-50"
                                >
                                    {loading ? 'Probando...' : 'Probar Conexión'}
                                </button>
                                <button
                                    onClick={saveSettings}
                                    disabled={loading}
                                    className="flex items-center gap-2 px-6 py-2 bg-lumen-gold text-black rounded font-bold text-[10px] uppercase hover:bg-white transition-all disabled:opacity-50"
                                >
                                    {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Guardar SMTP
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
