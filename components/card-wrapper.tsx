"use client"

import { GlareCard } from "@/components/ui/glare-card"
import { ReactNode } from "react"

export function CardWrapper({ children, className = "" }: { children: ReactNode, className?: string }) {
    // This wrapper constrains the size of the GlareCard component
    return (
        <div className={`flex items-center justify-center overflow-hidden max-w-[250px] mx-auto ${className}`} style={{ transform: 'scale(0.85)' }}>
            <GlareCard>
                {children}
            </GlareCard>
        </div>
    )
}