import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Mail, Globe, Send, ArrowRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useMarkdown } from '../hooks/useMarkdown';

// Updated Interactive Imports
import TutorialInteractive from './TutorialInteractive';
import FAQInteractive from './FAQInteractive';

interface PageProps {
    onBack: () => void;
    mode?: 'TERMS' | 'PRIVACY' | 'COOKIES' | 'LEGAL_NOTICE' | 'FAQ' | 'API_DOCS' | 'TUTORIAL' | 'CONTACT';
}

// --- HELPER WRAPPER ---
// Standardizes the look of all text-heavy pages (Legal, API)
const MarkdownPage = ({ file, title, onBack }: { file: string, title: string, onBack: () => void }) => {
    const { content, loading, error } = useMarkdown(file);

    return (
        <div className="w-full max-w-5xl mx-auto py-8 px-6 animate-[fadeIn_0.5s_ease-out]">
            <div className="mb-8 border-b border-white/5 pb-4">
                <h1 className="text-2xl font-light text-white tracking-widest uppercase">{title}</h1>
            </div>

            {error ? (
                <div className="p-8 text-red-400 bg-red-900/10 border border-red-500/20 rounded-lg">
                    <p>Error loading document: {file}</p>
                    <p className="text-xs opacity-50 mt-2">{error}</p>
                </div>
            ) : (
                <div className={`prose prose-invert prose-base prose-p:text-white/70 prose-headings:text-white/90 prose-a:text-[#D4AF37] max-w-3xl mx-auto min-h-[50vh] ${loading ? 'opacity-20' : 'opacity-100'}`}>
                    {loading ? (
                        <div className="animate-pulse space-y-4 pt-8">
                            <div className="h-8 bg-white/10 w-1/3 rounded" />
                            <div className="h-4 bg-white/5 w-full rounded" />
                            <div className="h-4 bg-white/5 w-full rounded" />
                            <div className="h-4 bg-white/5 w-3/4 rounded" />
                        </div>
                    ) : (
                        <ReactMarkdown>{content}</ReactMarkdown>
                    )}
                </div>
            )}
        </div>
    );
};

// --- CONTACT PAGE (No Address) ---

export const ContactPage: React.FC = () => {
    const navigate = useNavigate();
    const [subject, setSubject] = useState('support');

    return (
        <div className="w-full max-w-4xl mx-auto py-8 px-4 md:px-8 animate-[fadeIn_0.5s_ease-out]">
            <div className="mb-12 flex justify-between items-center border-b border-white/10 pb-6">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tight mb-2">Contact <span className="text-[#D4AF37]">Support</span></h1>
                    <p className="text-sm text-white/40">We typically respond within 24 hours.</p>
                </div>
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                    <span className="hidden md:inline text-xs font-bold tracking-[0.2em] uppercase">Close</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Visual Form */}
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest">Topic</label>
                        <select
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-[#D4AF37] outline-none transition-colors"
                        >
                            <option value="support">Technical Support</option>
                            <option value="billing">Billing & Tokens</option>
                            <option value="api">API Access</option>
                            <option value="enterprise">Enterprise Inquiry</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest">Your Email</label>
                        <input type="email" placeholder="user@example.com" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-[#D4AF37] outline-none" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest">Message</label>
                        <textarea rows={5} placeholder="Describe your issue..." className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-[#D4AF37] outline-none resize-none" />
                    </div>

                    <button className="w-full bg-[#D4AF37] hover:bg-[#F5D76E] text-black font-bold py-4 rounded-lg uppercase tracking-widest flex items-center justify-center gap-2 transition-transform hover:scale-[1.02]">
                        <Send className="w-4 h-4" /> Send Request
                    </button>
                </div>

                {/* Info Side (Reduced) */}
                <div className="space-y-8 md:pl-12 md:border-l border-white/5">
                    <div>
                        <h4 className="flex items-center gap-2 text-white font-bold mb-2">
                            <Mail className="w-5 h-5 text-[#D4AF37]" /> Direct Email
                        </h4>
                        <p className="text-2xl font-light text-white select-all">support@luxscaler.com</p>
                    </div>

                    <div className="p-6 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                        <h4 className="text-blue-400 font-bold text-sm mb-2 uppercase">API Support</h4>
                        <p className="text-blue-200/60 text-xs">
                            For API integration issues, please include your <code>client_id</code> in the subject line for faster routing.
                        </p>
                    </div>

                    <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                        <h4 className="text-white font-bold text-sm mb-2 uppercase">Office Hours</h4>
                        <p className="text-white/60 text-xs">Mon-Fri: 09:00 - 18:00 CET</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- MAIN ROUTER ---

export const InfoPages: React.FC<PageProps> = (props) => {
    switch (props.mode) {
        // Interactive Components
        case 'FAQ': return <FAQInteractive onBack={props.onBack} />;
        case 'TUTORIAL': return <TutorialInteractive onBack={props.onBack} />;

        // Markdown Content
        case 'API_DOCS': return <MarkdownPage {...props} file="api-docs.md" title="API Documentation" />;

        // Legal Docs
        case 'TERMS': return <MarkdownPage {...props} file="terms-v3.4-FINAL.md" title="Terms of Service" />;
        case 'PRIVACY': return <MarkdownPage {...props} file="privacy-v3.4-FINAL.md" title="Privacy Policy" />;
        case 'COOKIES': return <MarkdownPage {...props} file="cookie-policy-v1.0-FINAL.md" title="Cookie Policy" />;
        case 'LEGAL_NOTICE': return <MarkdownPage {...props} file="legal-notice-v3.2-FINAL.md" title="Legal Notice" />;
        case 'CONTACT': return <ContactPage />;

        default: return <MarkdownPage {...props} file="terms-v3.4-FINAL.md" title="Information" />;
    }
};

// --- COMPATIBILITY EXPORTS (Required by App.tsx) ---
// --- STANDALONE EXPORTS FOR ROUTER ---
export const TermsPage = () => {
    const navigate = useNavigate();
    return <MarkdownPage onBack={() => navigate(-1)} file="terms-v3.4-FINAL.md" title="Terms of Service" />;
};

export const PrivacyPage = () => {
    const navigate = useNavigate();
    return <MarkdownPage onBack={() => navigate(-1)} file="privacy-v3.4-FINAL.md" title="Privacy Policy" />;
};

export const CookiesPage = () => {
    const navigate = useNavigate();
    return <MarkdownPage onBack={() => navigate(-1)} file="cookie-policy-v1.0-FINAL.md" title="Cookie Policy" />;
};

export const LegalNoticePage = () => {
    const navigate = useNavigate();
    return <MarkdownPage onBack={() => navigate(-1)} file="legal-notice-v3.2-FINAL.md" title="Legal Notice" />;
};

export const APIDocsPage = () => {
    const navigate = useNavigate();
    return <MarkdownPage onBack={() => navigate(-1)} file="api-docs.md" title="API Documentation" />;
};

// --- COMPATIBILITY EXPORTS (Deprecated) ---
// Kept temporarily if referenced elsewhere, but standardizing to the above.
export const TutorialPageComp = () => {
    const navigate = useNavigate();
    return <TutorialInteractive onBack={() => navigate(-1)} />;
};

export const FAQPageComp = () => {
    const navigate = useNavigate();
    return <FAQInteractive onBack={() => navigate(-1)} />;
};

export const LegalSearch = () => null;
