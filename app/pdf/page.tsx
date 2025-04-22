"use client";

import { useEffect, useState } from "react";
import SimpleHtmlViewer from "@/components/simple-pdf-viewer";

export default function Page() {
    const [content, setContent] = useState("");
    const searchTerm = "Monster"; // <–– der zu highlightende Begriff

    useEffect(() => {
        // 1) Lade die HTML-Datei aus public/rules.html
        fetch("./rules.html")
            .then((res) => res.text())
            .then((html) => {
                // 2) Highlight jedes Vorkommen
                const regex = new RegExp(`(${searchTerm})`, "gi");
                const highlighted = html.replace(
                    regex,
                    '<mark style="background: yellow; padding:0;">$1</mark>'
                );
                setContent(highlighted);
            })
            .catch((err) => {
                console.error("Fehler beim Laden der rules.html:", err);
            });
    }, []);

    return (

       <SimpleHtmlViewer htmlUrl={"./rules.html"} searchText={searchTerm} />
    );
}
