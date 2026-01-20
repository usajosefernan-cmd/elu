
import React, { useState, useEffect } from 'react';
import { Search, Shield, Users, Mail, Download, Coins, Activity, AlertCircle, RotateCcw, Send, Star, UserPlus } from 'lucide-react';
import { getSupabaseClient } from '../../services/authService';
import { AdminWaitlist } from './AdminWaitlist';
import { AdminMarketing } from './AdminMarketing';

interface UserData {
    id: string;
    email: string;
    created_at: string;
    last_sign_in: string | null;
    tokens_balance: number; // Renamed from lumens
    subscription_status: string;
    waitlist_status?: 'APPROVED' | 'PENDING' | 'NONE';
    access_code?: string;
    newsletter_status?: 'SUBSCRIBED' | 'UNSUBSCRIBED';
}

export const AdminUserManagement: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'USERS' | 'WAITLIST' | 'MARKETING'>('USERS');
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('ALL'); // ALL, PRO, FREE
    const supabase = getSupabaseClient();

    // Fetch Users & Join with Waitlist
    const fetchUsers = async () => {
        setLoading(true);
        try {
            // 1. Fetch Profiles
            const { data: profiles, error: profilesError } = await supabase
                .from('user_profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (profilesError) throw profilesError;

            // 2. Fetch Waitlist
            const { data: waitlistData, error: waitlistError } = await supabase
                .from('beta_waitlist')
                .select('email, status, access_code');

            if (waitlistError) {
                console.error("Error fetching waitlist:", waitlistError);
            }

            // 3. Merge Data (In-Memory Join)
            const mergedUsers: UserData[] = (profiles || []).map((profile: any) => {
                const waitlistEntry = waitlistData?.find((w: any) => w.email === profile.email);
                return {
                    id: profile.id,
                    email: profile.email,
                    created_at: profile.created_at,
                    last_sign_in: profile.last_sign_in_at || null,
                    tokens_balance: profile.tokens_balance || 0, // Fallback
                    subscription_status: profile.subscription_tier || 'free',
                    waitlist_status: waitlistEntry ? (waitlistEntry.status as any) : 'NONE',
                    access_code: waitlistEntry?.access_code,
                    newsletter_status: Math.random() > 0.5 ? 'SUBSCRIBED' : 'UNSUBSCRIBED' // MOCKED for now
                };
            });

            setUsers(mergedUsers);
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleManageTokens = async (userId: string, currentBalance: number) => {
        const amountStr = window.prompt(`Current Balance: ${currentBalance} Tokens.\nEnter amount to ADD (positive) or REMOVE (negative):`, "0");
        if (!amountStr) return;

        const amount = parseInt(amountStr);
        if (isNaN(amount) || amount === 0) return;

        const newBalance = currentBalance + amount;
        if (newBalance < 0) {
            alert("Error: Balance cannot be negative.");
            return;
        }

        try {
            const { error } = await supabase
                .from('user_profiles')
                .update({ tokens_balance: newBalance })
                .eq('id', userId);

            if (error) throw error;

            alert("Tokens updated successfully!");
            fetchUsers(); // Refresh
        } catch (err) {
            console.error("Error updating tokens:", err);
            alert("Failed to update tokens.");
        }
    };

    const handleExportCSV = () => {
        const csvContent = [
            ["ID", "Email", "Role", "Tokens", "Waitlist", "Newsletter", "Joined"],
            ...users.map(u => [
                u.id,
                u.email,
                u.subscription_status,
                u.tokens_balance,
                u.waitlist_status,
                u.newsletter_status,
                new Date(u.created_at).toLocaleDateString()
            ])
        ].map(e => e.join(",")).join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `lux_users_export_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    // Filter Logic
    const filteredUsers = users.filter(user => {
        const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) || user.id.includes(searchTerm);
        const matchesFilter = filterType === 'ALL' || user.subscription_status.toUpperCase() === filterType;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="h-full flex flex-col space-y-6">

            {/* HEADER & TABS */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-md">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tighter uppercase flex items-center gap-2">
                        <Users className="w-6 h-6 text-lumen-gold" />
                        User Management
                    </h2>
                    <p className="text-gray-400 text-xs font-mono uppercase tracking-widest mt-1">
                        Total Users: {users.length} | Pro: {users.filter(u => u.subscription_status === 'pro').length}
                    </p>
                </div>

                <div className="flex bg-black/40 rounded-lg p-1 border border-white/10">
                    <button
                        onClick={() => setActiveTab('USERS')}
                        className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'USERS' ? 'bg-lumen-gold text-black shadow-lg' : 'text-gray-500 hover:text-white'
                            }`}
                    >
                        Users DB
                    </button>
                    <div className="w-px bg-white/10 mx-1 my-2"></div>
                    <button
                        onClick={() => setActiveTab('WAITLIST')}
                        className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'WAITLIST' ? 'bg-lumen-gold text-black shadow-lg' : 'text-gray-500 hover:text-white'
                            }`}
                    >
                        Waitlist & Codes
                    </button>
                    <div className="w-px bg-white/10 mx-1 my-2"></div>
                    <button
                        onClick={() => setActiveTab('MARKETING')}
                        className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'MARKETING' ? 'bg-lumen-gold text-black shadow-lg' : 'text-gray-500 hover:text-white'
                            }`}
                    >
                        Marketing
                    </button>
                </div>
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 bg-transparent rounded-2xl border border-white/5 overflow-hidden flex flex-col relative min-h-[600px]">
                {/* Glass Effect Background */}
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-none"></div>

                <div className="relative z-10 h-full p-6 overflow-y-auto">

                    {activeTab === 'WAITLIST' && <AdminWaitlist />}

                    {activeTab === 'MARKETING' && <AdminMarketing />}

                    {activeTab === 'USERS' && (
                        <div className="space-y-6">
                            {/* TOOLBAR */}
                            <div className="flex flex-col md:flex-row gap-4 justify-between bg-black/20 p-4 rounded-xl border border-white/5">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <input
                                        type="text"
                                        placeholder="Search by email or ID..."
                                        className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:border-lumen-gold focus:outline-none transition-colors"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <select
                                        className="bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-xs font-bold text-white uppercase tracking-widest focus:border-lumen-gold focus:outline-none"
                                        value={filterType}
                                        onChange={(e) => setFilterType(e.target.value)}
                                    >
                                        <option value="ALL">All Tiers</option>
                                        <option value="FREE">Free</option>
                                        <option value="PRO">Pro</option>
                                    </select>
                                    <button
                                        onClick={handleExportCSV}
                                        className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors border border-white/10"
                                    >
                                        <Download className="w-4 h-4" />
                                        Export CSV
                                    </button>
                                </div>
                            </div>

                            {/* TABLE */}
                            <div className="overflow-x-auto rounded-xl border border-white/10">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-white/5 border-b border-white/10">
                                            <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-500">User</th>
                                            <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Waitlist Info</th>
                                            <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-500 text-center">Status</th>
                                            <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-500 text-center">Tokens</th>
                                            <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-500 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan={5} className="p-8 text-center text-gray-500 animate-pulse">
                                                    Loading user database...
                                                </td>
                                            </tr>
                                        ) : filteredUsers.map((user) => (
                                            <tr key={user.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${user.subscription_status === 'pro' ? 'bg-lumen-gold text-black' : 'bg-white/10 text-gray-400'}`}>
                                                            {user.email.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-white text-sm">{user.email}</div>
                                                            <div className="text-[10px] text-gray-500 font-mono">ID: {user.id.slice(0, 8)}...</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex flex-col gap-1">
                                                        {user.waitlist_status !== 'NONE' ? (
                                                            <span className={`text-[9px] px-2 py-0.5 rounded-full w-fit font-bold uppercase tracking-wider ${user.waitlist_status === 'APPROVED' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-500'
                                                                }`}>
                                                                {user.waitlist_status} {user.access_code ? `(${user.access_code})` : ''}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-600 text-[10px]">-</span>
                                                        )}
                                                        <span className={`text-[9px] flex items-center gap-1 ${user.newsletter_status === 'SUBSCRIBED' ? 'text-blue-400' : 'text-gray-600'}`}>
                                                            <Mail className="w-3 h-3" />
                                                            {user.newsletter_status === 'SUBSCRIBED' ? 'Newsletter ON' : 'No Newsletter'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest border ${user.subscription_status === 'pro'
                                                        ? 'bg-lumen-gold/10 text-lumen-gold border-lumen-gold/20'
                                                        : 'bg-white/5 text-gray-400 border-white/10'
                                                        }`}>
                                                        {user.subscription_status}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <div className="flex items-center justify-center gap-1 font-mono text-sm text-lumen-gold">
                                                        <Coins className="w-3 h-3" />
                                                        {user.tokens_balance}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <button
                                                        onClick={() => handleManageTokens(user.id, user.tokens_balance)}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white"
                                                        title="Manage Tokens"
                                                    >
                                                        <RotateCcw className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};
