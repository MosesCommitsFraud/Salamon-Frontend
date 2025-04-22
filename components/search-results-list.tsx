"use client"

import ResultTile, { type SearchResult } from "@/components/result-tile"

interface SearchResultsListProps {
  results: SearchResult[]
  pdfUrl?: string
}

export default function SearchResultsList({ results, pdfUrl }: SearchResultsListProps) {
  if (results.length === 0) {
    return null
  }

  return (
    <div className="my-4">
      <h3 className="text-sm font-medium mb-2">Gefundene Ergebnisse im Regelbuch:</h3>
      <div className="grid grid-cols-1 gap-2">
        {results.map((result, index) => (
          <ResultTile key={index} result={result} pdfUrl={pdfUrl} />
        ))}
      </div>
    </div>
  )
}
