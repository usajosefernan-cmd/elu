
"use client";
import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../utils/cn";

export const BackgroundBeams = ({ className }: { className?: string }) => {
    return (
        <div
            className={cn(
                "absolute h-full w-full inset-0 overflow-hidden bg-transparent",
                className
            )}
        >
            <div
                className="absolute h-full w-full inset-0 bg-transparent z-0 pointer-events-none"
                style={{
                    backgroundImage: `radial-gradient(circle at 50% -20%, rgba(120, 119, 198, 0.1) 0%, rgba(255, 255, 255, 0) 50%)`
                }}
            />
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.5 }}
                className="absolute inset-0 z-0 h-full w-full pointer-events-none"
            >
                {/* Subtle Grid - Dynamic */}
                <div className="absolute h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

                {/* Moving Beams */}
                <motion.div
                    animate={{
                        backgroundPosition: ["0% 0%", "100% 100%"],
                    }}
                    transition={{
                        duration: 20,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "linear",
                    }}
                    className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_800px_at_50%_-30%,#3b82f61a,transparent)] dark:bg-[radial-gradient(circle_800px_at_50%_-30%,#4c1d951a,transparent)]"
                />
            </motion.div>
        </div>
    );
};
