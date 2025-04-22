"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowUpRight, X, Loader2 } from "lucide-react"
import PdfViewer from "@/components/pdf-viewer"

// Exportierter SearchResult-Typ für die Wiederverwendung
export type SearchResult = {
  text: string
  pageNumber: number
  searchText: string
  position?: { top: number; left: number; width: number; height: number }
}

interface ResultTileProps {
  result: SearchResult
  pdfUrl?: string // Optional, falls verschiedene PDFs verwendet werden
}

export default function ResultTile({

  result,
  pdfUrl = "https://img.yugioh-card.com/en/downloads/rulebook/SD_RuleBook_EN_10.pdf",
}: ResultTileProps) {
  const [showPdf, setShowPdf] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = () => {
    setIsLoading(true)
    setShowPdf(true)
  }

  const closePdf = () => {
    setShowPdf(false)
  }

  // Wenn der PDF-Viewer geladen ist, setze isLoading auf false
  const handlePdfLoaded = () => {
    setIsLoading(false)
  }

  return (
    <>
      <Card
        className="p-3 cursor-pointer hover:bg-gray-50 transition-colors flex justify-between items-start gap-2"
        onClick={handleClick}
      >
        <div className="flex-1">
          <p className="text-sm">{result.text}</p>
          <p className="text-xs text-gray-500 mt-1">Seite {result.pageNumber}</p>
          {result.searchText && (
            <p className="text-xs text-blue-500 mt-1 truncate">
              Suchtext: {result.searchText.length > 30 ? `${result.searchText.substring(0, 30)}...` : result.searchText}
            </p>
          )}
        </div>
        <div className="flex items-center">
          {isLoading && showPdf ? (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          ) : (
            <ArrowUpRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
          )}
        </div>
      </Card>

      {/* PDF Modal */}
      {showPdf && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl h-[80vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="font-bold">Yu-Gi-Oh! Regelbuch</h2>
              <Button variant="outline" size="sm" onClick={closePdf}>
                <X className="h-4 w-4 mr-1" /> Schließen
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <PdfViewer pdfUrl={pdfUrl} highlight={result} onLoaded={handlePdfLoaded} />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
