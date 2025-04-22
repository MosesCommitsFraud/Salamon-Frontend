"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, Search } from "lucide-react";

interface SimpleHtmlViewerProps {
    htmlUrl: string;
    searchText: string;
    initialScale?: number;
    /**
     * Delay (in ms) before automatisch zum gefundenen Abschnitt gescrollt wird.
     * Default: 300 ms
     */
    scrollDelay?: number;
    onLoaded?: () => void;
    onSearchFound?: (count: number) => void;
}

// Utility to escape special regex characters in search term
function escapeRegex(text: string) {
    return text.replace(/[-\\/\\^$*+?.()|[\]{}]/g, "\\$&");
}

export default function SimpleHtmlViewer({
                                             htmlUrl,
                                             searchText,
                                             initialScale = 1,
                                             scrollDelay = 300,
                                             onLoaded,
                                             onSearchFound,
                                         }: SimpleHtmlViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [originalHtml, setOriginalHtml] = useState<string>("");
    const [renderHtml, setRenderHtml] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [searchStatus, setSearchStatus] =
        useState<"idle" | "searching" | "found" | "not-found">("idle");
    const [foundCount, setFoundCount] = useState<number>(0);
    const [scale, setScale] = useState<number>(initialScale);

    // 1. Load HTML
    useEffect(() => {
        setIsLoading(true);
        fetch(htmlUrl)
            .then((res) => res.text())
            .then((html) => {
                setOriginalHtml(html);
                setIsLoading(false);
                onLoaded?.();
            })
            .catch(() => {
                setOriginalHtml("<p>Fehler beim Laden der Seite.</p>");
                setIsLoading(false);
            });
    }, [htmlUrl, onLoaded]);

    // 2. Evaluate search (no visual highlight, use first three words)
    useEffect(() => {
        if (!originalHtml) return;

        // Reset when search text is cleared
        if (!searchText) {
            setRenderHtml(originalHtml);
            setSearchStatus("idle");
            setFoundCount(0);
            return;
        }

        setSearchStatus("searching");

        // Only use the first three words of the search term
        const prefix = searchText.trim().split(/\s+/).slice(0, 3).join(" ");
        if (!prefix) {
            setSearchStatus("idle");
            return;
        }

        const regex = new RegExp(escapeRegex(prefix), "gi");
        const matches = [...originalHtml.matchAll(regex)];
        const count = matches.length;
        setFoundCount(count);
        setSearchStatus(count > 0 ? "found" : "not-found");
        onSearchFound?.(count);

        // Inject an invisible anchor before the first match so we can scroll to it
        if (count > 0) {
            let first = true;
            const annotated = originalHtml.replace(regex, (match) => {
                if (first) {
                    first = false;
                    return `<span id="__scroll_target__"></span>${match}`;
                }
                return match;
            });
            setRenderHtml(annotated);
        } else {
            setRenderHtml(originalHtml);
        }
    }, [originalHtml, searchText, onSearchFound]);

    // 3. Apply zoom via CSS transform
    useEffect(() => {
        const el = containerRef.current;
        if (el) {
            el.style.transform = `scale(${scale})`;
            el.style.transformOrigin = "top left";
        }
    }, [scale]);

    // 4. Scroll to the injected anchor when a match is found – with delay
    useEffect(() => {
        if (searchStatus !== "found") return;

        const timer = setTimeout(() => {
            const el = containerRef.current;
            const anchor = el?.querySelector("#__scroll_target__");
            anchor?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, scrollDelay);

        return () => clearTimeout(timer);
    }, [searchStatus, renderHtml, scrollDelay]);

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-2 border-b">
                <div className="flex items-center gap-2">
                    {isLoading && <Loader2 className="animate-spin" />}
                    {!isLoading && searchStatus === "found" && (
                        <span className="flex items-center gap-1">
              <Search /> {foundCount} Hit
            </span>
                    )}
                </div>
            </div>

            <div
                ref={containerRef}
                className="flex-1 overflow-auto p-4 relative"
                dangerouslySetInnerHTML={{ __html: renderHtml }}
            />
        </div>
    );
}
