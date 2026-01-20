
import { Fingerprint, Eye, Palette, Layers, Scan, Activity, Shield, Clock, Trash2, Sun, PenTool, Box, Zap, Database, Play, LucideIcon } from 'lucide-react';

export interface ShowcaseExample {
    title: string;
    sub: string;
    icon: LucideIcon;
    before: string;
    after: string;
    focusPoint?: { x: number; y: number };
    // DYNAMIC LAYOUT SYSTEM
    layout?: 'full' | 'split' | 'detail' | 'hero';
    effectLabel?: string;
    detailCrop?: { x: number; y: number; zoom: number };
}

// NOMENCLATURA: XX01 = ORIGINAL (before), XX02 = PROCESADO (after)
export const PHOTOSCALER_EXAMPLES: ShowcaseExample[] = [
    // 01 - FULL con overlay
    {
        title: "DETAIL RECOV",
        sub: "Textural Synthesis",
        icon: Fingerprint,
        before: "https://pjscnzymofaijevonxkm.supabase.co/storage/v1/object/public/lux-storage/webasset/landing/0701.webp",
        after: "https://pjscnzymofaijevonxkm.supabase.co/storage/v1/object/public/lux-storage/webasset/landing/0702.webp",
        layout: 'full',
        effectLabel: "TEXTURE+"
    },
    // 02 - FULL
    {
        title: "CLARITY ENHANCE",
        sub: "Edge Refinement",
        icon: Eye,
        before: "https://pjscnzymofaijevonxkm.supabase.co/storage/v1/object/public/lux-storage/webasset/landing/0301.webp",
        after: "https://pjscnzymofaijevonxkm.supabase.co/storage/v1/object/public/lux-storage/webasset/landing/0302.webp",
        layout: 'full'
    },
    // 03 - DETAIL con zoom de ojo
    {
        title: "MICRO DETAIL",
        sub: "Pixel Reconstruction",
        icon: Scan,
        before: "https://pjscnzymofaijevonxkm.supabase.co/storage/v1/object/public/lux-storage/webasset/landing/0401.webp",
        after: "https://pjscnzymofaijevonxkm.supabase.co/storage/v1/object/public/lux-storage/webasset/landing/0402.webp",
        layout: 'detail',
        effectLabel: "EYE DETAIL",
        detailCrop: { x: 45, y: 25, zoom: 2.5 }
    },
    // 04-05 - SPLIT: Color vs Full Restore
    {
        title: "COLOR MATRIX",
        sub: "Chromatic Balance",
        icon: Palette,
        before: "https://pjscnzymofaijevonxkm.supabase.co/storage/v1/object/public/lux-storage/webasset/landing/0501.webp",
        after: "https://pjscnzymofaijevonxkm.supabase.co/storage/v1/object/public/lux-storage/webasset/landing/0502.webp",
        layout: 'split'
    },
    {
        title: "FULL RESTORE",
        sub: "Complex Pipeline",
        icon: Layers,
        before: "https://pjscnzymofaijevonxkm.supabase.co/storage/v1/object/public/lux-storage/webasset/landing/0801.webp",
        after: "https://pjscnzymofaijevonxkm.supabase.co/storage/v1/object/public/lux-storage/webasset/landing/0802.webp",
        layout: 'full' // Será consumido por el split anterior
    },
    // 06 - FULL
    {
        title: "TEXTURE LOCK",
        sub: "Organic Preservation",
        icon: Activity,
        before: "https://pjscnzymofaijevonxkm.supabase.co/storage/v1/object/public/lux-storage/webasset/landing/0601.webp",
        after: "https://pjscnzymofaijevonxkm.supabase.co/storage/v1/object/public/lux-storage/webasset/landing/0602.webp",
        layout: 'full',
        effectLabel: "PRESERVE"
    },
    // 07 - DETAIL con zoom de skin
    {
        title: "FORENSIC SCAN",
        sub: "Evidence Extraction",
        icon: Shield,
        before: "https://pjscnzymofaijevonxkm.supabase.co/storage/v1/object/public/lux-storage/webasset/landing/0901.webp",
        after: "https://pjscnzymofaijevonxkm.supabase.co/storage/v1/object/public/lux-storage/webasset/landing/0902.webp",
        layout: 'detail',
        detailCrop: { x: 50, y: 40, zoom: 2 }
    },
    // 08 - FULL (legacy photo - focusPoint custom)
    {
        title: "LEGACY PHOTO",
        sub: "Temporal Repair",
        icon: Clock,
        before: "https://pjscnzymofaijevonxkm.supabase.co/storage/v1/object/public/lux-storage/webasset/landing/1001.webp",
        after: "https://pjscnzymofaijevonxkm.supabase.co/storage/v1/object/public/lux-storage/webasset/landing/1002.webp",
        focusPoint: { x: 50, y: 20 },
        layout: 'full',
        effectLabel: "RESTORE"
    },
    // 09-10 - SPLIT: Artifact vs Contrast
    {
        title: "ARTIFACT KILL",
        sub: "Noise Reduction",
        icon: Trash2,
        before: "https://pjscnzymofaijevonxkm.supabase.co/storage/v1/object/public/lux-storage/webasset/landing/1401.webp",
        after: "https://pjscnzymofaijevonxkm.supabase.co/storage/v1/object/public/lux-storage/webasset/landing/1402.webp",
        layout: 'split'
    },
    {
        title: "CONTRAST OPT",
        sub: "Dynamic Range",
        icon: Sun,
        before: "https://pjscnzymofaijevonxkm.supabase.co/storage/v1/object/public/lux-storage/webasset/landing/1301.webp",
        after: "https://pjscnzymofaijevonxkm.supabase.co/storage/v1/object/public/lux-storage/webasset/landing/1302.webp",
        layout: 'full'
    },
    // 11 - FULL
    {
        title: "EDGE DEFINE",
        sub: "Boundary Logic",
        icon: PenTool,
        before: "https://pjscnzymofaijevonxkm.supabase.co/storage/v1/object/public/lux-storage/webasset/landing/1201.webp",
        after: "https://pjscnzymofaijevonxkm.supabase.co/storage/v1/object/public/lux-storage/webasset/landing/1202.webp",
        layout: 'full'
    },
    // 12 - DETAIL
    {
        title: "DEPTH RECOV",
        sub: "3D Spatial Analysis",
        icon: Box,
        before: "https://pjscnzymofaijevonxkm.supabase.co/storage/v1/object/public/lux-storage/webasset/landing/1501.webp",
        after: "https://pjscnzymofaijevonxkm.supabase.co/storage/v1/object/public/lux-storage/webasset/landing/1502.webp",
        layout: 'detail',
        effectLabel: "3D DEPTH",
        detailCrop: { x: 50, y: 50, zoom: 1.8 }
    },
    // 13 - FULL
    {
        title: "LIGHT CORR",
        sub: "Volumetric Balancer",
        icon: Zap,
        before: "https://pjscnzymofaijevonxkm.supabase.co/storage/v1/object/public/lux-storage/webasset/landing/1601.webp",
        after: "https://pjscnzymofaijevonxkm.supabase.co/storage/v1/object/public/lux-storage/webasset/landing/1602.webp",
        layout: 'full',
        effectLabel: "LIGHT+"
    },
    // 14-15 - SPLIT: Batch vs Realtime
    {
        title: "BATCH PROC",
        sub: "Mass Automation",
        icon: Database,
        before: "https://pjscnzymofaijevonxkm.supabase.co/storage/v1/object/public/lux-storage/webasset/landing/1701.webp",
        after: "https://pjscnzymofaijevonxkm.supabase.co/storage/v1/object/public/lux-storage/webasset/landing/1702.webp",
        layout: 'split'
    },
    {
        title: "REALTIME PREV",
        sub: "Instant Feedback",
        icon: Play,
        before: "https://pjscnzymofaijevonxkm.supabase.co/storage/v1/object/public/lux-storage/webasset/landing/1801.webp",
        after: "https://pjscnzymofaijevonxkm.supabase.co/storage/v1/object/public/lux-storage/webasset/landing/1802.webp",
        layout: 'full'
    },
];

// STYLESCALER - Color Science & Film Grading
export const STYLESCALER_EXAMPLES: ShowcaseExample[] = [
    {
        title: "FILM EMULATION",
        sub: "Analog Color Science",
        icon: Palette,
        before: "https://pjscnzymofaijevonxkm.supabase.co/storage/v1/object/public/lux-storage/webasset/landing/0501.webp",
        after: "https://pjscnzymofaijevonxkm.supabase.co/storage/v1/object/public/lux-storage/webasset/landing/0502.webp",
        layout: 'full',
        effectLabel: "CINEMATIC"
    },
    {
        title: "COLOR GRADE",
        sub: "Hollywood LUT System",
        icon: Activity,
        before: "https://pjscnzymofaijevonxkm.supabase.co/storage/v1/object/public/lux-storage/webasset/landing/0301.webp",
        after: "https://pjscnzymofaijevonxkm.supabase.co/storage/v1/object/public/lux-storage/webasset/landing/0302.webp",
        layout: 'full'
    },
    {
        title: "SKIN TONE",
        sub: "Portrait Harmonics",
        icon: Eye,
        before: "https://pjscnzymofaijevonxkm.supabase.co/storage/v1/object/public/lux-storage/webasset/landing/0401.webp",
        after: "https://pjscnzymofaijevonxkm.supabase.co/storage/v1/object/public/lux-storage/webasset/landing/0402.webp",
        layout: 'detail',
        detailCrop: { x: 50, y: 30, zoom: 2 }
    },
];

// LIGHTSCALER - Studio Lighting Simulation
export const LIGHTSCALER_EXAMPLES: ShowcaseExample[] = [
    {
        title: "KEY LIGHT",
        sub: "Primary Illumination",
        icon: Sun,
        before: "https://pjscnzymofaijevonxkm.supabase.co/storage/v1/object/public/lux-storage/webasset/landing/0601.webp",
        after: "https://pjscnzymofaijevonxkm.supabase.co/storage/v1/object/public/lux-storage/webasset/landing/0602.webp",
        layout: 'full',
        effectLabel: "STUDIO"
    },
    {
        title: "FILL LIGHT",
        sub: "Shadow Lift",
        icon: Zap,
        before: "https://pjscnzymofaijevonxkm.supabase.co/storage/v1/object/public/lux-storage/webasset/landing/0801.webp",
        after: "https://pjscnzymofaijevonxkm.supabase.co/storage/v1/object/public/lux-storage/webasset/landing/0802.webp",
        layout: 'full'
    },
    {
        title: "RIM LIGHT",
        sub: "Edge Separation",
        icon: Layers,
        before: "https://pjscnzymofaijevonxkm.supabase.co/storage/v1/object/public/lux-storage/webasset/landing/0901.webp",
        after: "https://pjscnzymofaijevonxkm.supabase.co/storage/v1/object/public/lux-storage/webasset/landing/0902.webp",
        layout: 'detail',
        detailCrop: { x: 50, y: 40, zoom: 1.8 }
    },
];

// UPSCALER - Resolution Enhancement
export const UPSCALER_EXAMPLES: ShowcaseExample[] = [
    {
        title: "4K UPSCALE",
        sub: "Resolution Synthesis",
        icon: Scan,
        before: "https://pjscnzymofaijevonxkm.supabase.co/storage/v1/object/public/lux-storage/webasset/landing/1001.webp",
        after: "https://pjscnzymofaijevonxkm.supabase.co/storage/v1/object/public/lux-storage/webasset/landing/1002.webp",
        layout: 'full',
        effectLabel: "4K"
    },
    {
        title: "TEXTURE GEN",
        sub: "Detail Hallucination",
        icon: Fingerprint,
        before: "https://pjscnzymofaijevonxkm.supabase.co/storage/v1/object/public/lux-storage/webasset/landing/1201.webp",
        after: "https://pjscnzymofaijevonxkm.supabase.co/storage/v1/object/public/lux-storage/webasset/landing/1202.webp",
        layout: 'detail',
        detailCrop: { x: 50, y: 50, zoom: 3 }
    },
    {
        title: "PRINT READY",
        sub: "150MP Output",
        icon: Box,
        before: "https://pjscnzymofaijevonxkm.supabase.co/storage/v1/object/public/lux-storage/webasset/landing/1301.webp",
        after: "https://pjscnzymofaijevonxkm.supabase.co/storage/v1/object/public/lux-storage/webasset/landing/1302.webp",
        layout: 'full'
    },
];
