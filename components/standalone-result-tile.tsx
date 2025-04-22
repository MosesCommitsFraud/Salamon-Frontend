"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowUpRight, X, Loader2 } from "lucide-react"
import SimpleHtmlViewer from "@/components/simple-pdf-viewer"

export interface StandaloneResultTileProps {
    text: string
    htmlUrl?: string
}

const MAX_PREVIEW_LENGTH = 100

export default function StandaloneResultTile({
                                                 text,
                                                 htmlUrl = "./rules.html",
                                             }: StandaloneResultTileProps) {
    const [showViewer, setShowViewer] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [foundCount, setFoundCount] = useState<number | null>(null)

    const handleClick = () => {
        setIsLoading(true)
        setShowViewer(true)
    }

    const closeViewer = () => {
        setShowViewer(false)
    }

    const handleLoaded = () => {
        setIsLoading(false)
    }

    const handleSearchFound = (count: number) => {
        setFoundCount(count)
    }

    const previewText =
        text.length > MAX_PREVIEW_LENGTH ? `${text.slice(0, MAX_PREVIEW_LENGTH)}…` : text

    return (
        <>
            <Card
                className="p-3 cursor-pointer hover:bg-muted transition-colors flex justify-between items-start gap-2"
                onClick={handleClick}
            >
                <p className="text-sm text-grey- flex-1">{previewText}</p>
                <div className="flex items-center">
                    {isLoading && showViewer ? (
                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    ) : (
                        <ArrowUpRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    )}
                </div>
            </Card>

            {showViewer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
                    <Card className="w-full max-w-3xl h-[80vh] flex flex-col overflow-hidden">
                        <div className="flex-none p-4 border-b bg-black flex justify-between items-center">
                            <h2 className="font-bold text-lg">Yu‑Gi‑Oh! Rulebook</h2>
                            <Button variant="outline" size="sm" onClick={closeViewer}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="flex-1 overflow-auto bg-black">
                            <SimpleHtmlViewer
                                htmlUrl={htmlUrl}
                                searchText={text}
                                onLoaded={handleLoaded}
                                onSearchFound={handleSearchFound}
                            />
                        </div>
                    </Card>
                </div>
            )}
        </>
    )
}
