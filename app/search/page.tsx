"use client"

import React, { useState } from "react";

export default function Home() {
    const [searchQuery, setSearchQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`/api/search?query=${encodeURIComponent(searchQuery)}`);
            const data = await res.json();
            setResults(data.results);
        } catch (error) {
            console.error(error);
        }
        setLoading(false);
    };

    return (
        <div style={{ padding: "2rem" }}>
            <h1>Azure AI Search</h1>
            <form onSubmit={handleSearch}>
                <input
                    type="text"
                    placeholder="Suchbegriff eingeben"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ padding: "0.5rem", width: "300px" }}
                />
                <button type="submit" style={{ padding: "0.5rem 1rem", marginLeft: "1rem" }}>
                    Suchen
                </button>
            </form>
            {loading && <p>Laden...</p>}
            {results.length > 0 && (
                <ul style={{ marginTop: "2rem" }}>
                    {results.map((result) => (
                        <li key={result.id} style={{ marginBottom: "1rem" }}>
                            <strong>Score:</strong> {result.similarity} <br />
                            <strong>Text:</strong> {result.text}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
