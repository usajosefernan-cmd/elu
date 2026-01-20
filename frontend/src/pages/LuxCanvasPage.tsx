import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLuxCanvas } from '../components/admin/luxcanvas/AdminLuxCanvas';

export const LuxCanvasPage: React.FC = () => {
    const navigate = useNavigate();

    const handleBack = () => {
        navigate('/admin');
    };

    return (
        <div className="fixed inset-0 z-50 overflow-hidden bg-[#0a0a0a]">
            <AdminLuxCanvas onBack={handleBack} />
        </div>
    );
};
