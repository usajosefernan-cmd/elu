
import React from "react";
import { cn } from "../../utils/cn";

interface GlowingBorderProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    containerClassName?: string;
    color?: string;
    gradientFrom?: string;
    gradientTo?: string;
}

export const GlowingBorder = ({
    children,
    className,
    containerClassName,
    color,
    gradientFrom = "#D4AF37",
    gradientTo = "#D4AF37",
    ...props
}: GlowingBorderProps) => {
    return (
        <div
            className={cn("relative h-full w-full overflow-hidden rounded-[20px] p-[1.5px]", containerClassName)}
            {...props}
        >
            <div className="absolute inset-[-100%] animate-[spin_3s_linear_infinite]"
                style={{
                    background: `conic-gradient(from 90deg at 50% 50%, #0000 0%, #0000 50%, ${gradientFrom} 50%, ${gradientTo} 100%)`
                }}
            />
            <div className={cn("relative h-full w-full rounded-[19px] bg-black", className)}>
                {children}
            </div>
        </div>
    );
};
