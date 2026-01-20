
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Lock } from 'lucide-react';

interface ComparisonSliderProps {
    originalImage: string;
    processedImage: string;
    aspectRatio?: number;
    isLocked?: boolean;
    objectFit?: 'cover' | 'contain' | 'none';
    enableNativeScrolling?: boolean;
    staticZoomLevel?: number;
    focusPoint?: { x: number, y: number };
    onAspectRatioChange?: (ratio: number) => void;
    className?: string;
    style?: React.CSSProperties;
}

export const ComparisonSlider: React.FC<ComparisonSliderProps> = ({
    originalImage,
    processedImage,
    aspectRatio,
    isLocked = false,
    objectFit = 'contain', // Default to contain to see full frame changes
    enableNativeScrolling = false,
    staticZoomLevel = 1,
    focusPoint = { x: 50, y: 50 },
    onAspectRatioChange,
    className = '',
    style = {}
}) => {
    const [sliderPosition, setSliderPosition] = useState(50);
    const [isDraggingSlider, setIsDraggingSlider] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);

    // --- SMART ASPECT RATIO DETECTION ---
    const handleProcessedImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { naturalWidth, naturalHeight } = e.currentTarget;
        if (naturalWidth && naturalHeight && onAspectRatioChange) {
            const detectedRatio = naturalWidth / naturalHeight;
            // Notify parent to resize container to fit the NEW structure
            onAspectRatioChange(detectedRatio);
        }
    };

    // --- SLIDER LOGIC ---
    const updateSlider = useCallback((clientX: number) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
        const percentage = (x / rect.width) * 100;
        setSliderPosition(percentage);
    }, []);

    const handleSliderMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setIsDraggingSlider(true);
    };

    const handleSliderTouchStart = (e: React.TouchEvent) => {
        e.stopPropagation();
        setIsDraggingSlider(true);
    }

    useEffect(() => {
        const handleGlobalMouseUp = () => setIsDraggingSlider(false);
        const handleGlobalTouchEnd = () => setIsDraggingSlider(false);
        window.addEventListener('mouseup', handleGlobalMouseUp);
        window.addEventListener('touchend', handleGlobalTouchEnd);
        return () => {
            window.removeEventListener('mouseup', handleGlobalMouseUp);
            window.removeEventListener('touchend', handleGlobalTouchEnd);
        };
    }, []);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDraggingSlider) {
            e.preventDefault();
            e.stopPropagation();
            updateSlider(e.clientX);
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (isDraggingSlider) {
            e.stopPropagation();
            updateSlider(e.touches[0].clientX);
        }
    };

    const heroZoomStyle: React.CSSProperties = staticZoomLevel > 1 ? {
        transform: `scale(${staticZoomLevel})`,
        transformOrigin: `${focusPoint.x}% ${focusPoint.y}%`,
        transition: 'transform 0.5s ease-out'
    } : {};

    return (
        <div
            ref={containerRef}
            className={`relative w-full h-full overflow-hidden select-none group ${className}`}
            style={{
                // Ensure the container respects the passed aspect ratio if set explicitly
                aspectRatio: aspectRatio,
                cursor: isDraggingSlider ? 'ew-resize' : 'default',
                ...style
            }}
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
        >
            {/* IMAGE CONTAINER - REMOVED bg-black/20 overlay to prevent dimming */}
            <div className="absolute inset-0 w-full h-full">
                {/* AFTER IMAGE (Base - Right Side) - The Truth of the new structure */}
                <img
                    src={processedImage}
                    alt="After"
                    onLoad={handleProcessedImageLoad}
                    className={`absolute inset-0 w-full h-full object-${objectFit}`}
                    draggable={false}
                    style={{
                        objectPosition: `${focusPoint.x}% ${focusPoint.y}%`,
                        ...heroZoomStyle
                    }}
                    loading="lazy"
                    decoding="async"
                />

                {/* BEFORE IMAGE (Overlay - Left Side) - Centered to match */}
                <div className="absolute inset-0 w-full h-full">
                    <img
                        src={originalImage}
                        alt="Before"
                        // UPDATED: Removed 'opacity-80' to ensure 100% opacity as requested
                        className={`w-full h-full object-${objectFit} opacity-100`}
                        style={{
                            clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
                            objectPosition: `${focusPoint.x}% ${focusPoint.y}%`,
                            ...heroZoomStyle
                        }}
                        draggable={false}
                        loading="lazy"
                        decoding="async"
                    />
                </div>

                {isLocked && staticZoomLevel === 1 && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-40 pointer-events-none z-0">
                        <Lock className="w-12 h-12 text-white" />
                    </div>
                )}
            </div>

            {/* SLIDER HANDLE (Custom Lux Style) */}
            <div
                className="absolute top-0 bottom-0 w-8 -ml-4 flex items-center justify-center cursor-ew-resize z-40"
                style={{ left: `${sliderPosition}%` }}
                onMouseDown={handleSliderMouseDown}
                onTouchStart={handleSliderTouchStart}
            >
                {/* Vertical Line */}
                <div className="w-[1px] bg-white/80 h-full shadow-[0_0_10px_rgba(0,0,0,0.8)]"></div>

                {/* Circle Handle */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 border border-white/80 rounded-full flex items-center justify-center backdrop-blur-sm transition-transform hover:scale-110">
                    <span className="text-white text-xs opacity-80">↔</span>
                </div>
            </div>
        </div>
    );
};
