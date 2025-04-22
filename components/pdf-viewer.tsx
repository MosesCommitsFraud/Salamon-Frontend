"use client"

import { useState, useEffect, useRef } from "react"
import { Document, Page } from "react-pdf"
import { Loader2 } from "lucide-react"
import { Button } from "../../../Downloads/yugioh-rag-chat/components/ui/button"
import type { SearchResult } from "@/components/result-tile"

// Import pdfjs directly and set the worker
import * as pdfjs from "pdfjs-dist"
// Use a specific version that's known to be available
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`

interface PdfViewerProps {
  pdfUrl: string
  highlight: SearchResult
  onLoaded?: () => void // Callback für wenn das PDF geladen ist
}

export default function PdfViewer({ pdfUrl, highlight, onLoaded }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState<number>(highlight.pageNumber || 1)
  const [scale, setScale] = useState<number>(1.2)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isSearching, setIsSearching] = useState<boolean>(false)
  const [textItems, setTextItems] = useState<any[]>([])
  const [foundTextPositions, setFoundTextPositions] = useState<
    Array<{ top: number; left: number; width: number; height: number }>
  >([])
  const canvasRef = useRef<HTMLDivElement>(null)
  const pdfDocumentRef = useRef<any>(null)

  function onDocumentLoadSuccess({ numPages, pdfDocument }: { numPages: number; pdfDocument: any }) {
    setNumPages(numPages)
    setIsLoading(false)
    pdfDocumentRef.current = pdfDocument

    // Callback für wenn das PDF geladen ist
    if (onLoaded) {
      onLoaded()
    }

    // If we have a search text, start searching after the document loads
    if (highlight.searchText) {
      searchTextInPage(pdfDocument, pageNumber, highlight.searchText)
    }
  }

  // Function to search for text in the PDF page
  const searchTextInPage = async (pdfDocument: any, pageNum: number, searchText: string) => {
    if (!pdfDocument) return

    setIsSearching(true)
    try {
      // Get the page
      const page = await pdfDocument.getPage(pageNum)

      // Get the text content
      const textContent = await page.getTextContent()
      setTextItems(textContent.items)

      // Search for the text
      const foundPositions: Array<{ top: number; left: number; width: number; height: number }> = []

      // Normalize search text (lowercase, trim whitespace)
      const normalizedSearchText = searchText.toLowerCase().trim()

      // Create a combined text from all items to search in
      let fullText = ""
      const itemPositions: Array<{ start: number; end: number; item: any }> = []

      textContent.items.forEach((item: any) => {
        const start = fullText.length
        fullText += item.str
        const end = fullText.length
        itemPositions.push({ start, end, item })
      })

      // Search for the text in the full text
      const normalizedFullText = fullText.toLowerCase()
      let searchIndex = 0

      while (searchIndex < normalizedFullText.length) {
        const foundIndex = normalizedFullText.indexOf(normalizedSearchText, searchIndex)
        if (foundIndex === -1) break

        // Find which text items contain this match
        const matchingItems = itemPositions.filter(
          (pos) =>
            (foundIndex >= pos.start && foundIndex < pos.end) ||
            (foundIndex + normalizedSearchText.length > pos.start &&
              foundIndex + normalizedSearchText.length <= pos.end),
        )

        if (matchingItems.length > 0) {
          // Get the viewport to transform coordinates
          const viewport = page.getViewport({ scale: 1.0 })

          // Calculate the bounding box for all matching items
          let minX = Number.POSITIVE_INFINITY,
            minY = Number.POSITIVE_INFINITY,
            maxX = Number.NEGATIVE_INFINITY,
            maxY = Number.NEGATIVE_INFINITY

          matchingItems.forEach(({ item }) => {
            const transform = pdfjs.Util.transform(viewport.transform, item.transform)

            // Calculate the bounds based on the transform
            const x = transform[4]
            const y = transform[5]
            const width = item.width || item.str.length * 5 // Estimate if width not available
            const height = item.height || 12 // Estimate if height not available

            minX = Math.min(minX, x)
            minY = Math.min(minY, y - height) // PDF coordinates are bottom-up
            maxX = Math.max(maxX, x + width)
            maxY = Math.max(maxY, y)
          })

          // Add the position to our found positions
          foundPositions.push({
            left: minX,
            top: viewport.height - maxY, // Convert to top-down coordinates
            width: maxX - minX,
            height: maxY - minY,
          })
        }

        // Move search index forward
        searchIndex = foundIndex + normalizedSearchText.length
      }

      setFoundTextPositions(foundPositions)
      console.log("Found positions:", foundPositions)
    } catch (error) {
      console.error("Error searching text:", error)
    } finally {
      setIsSearching(false)
    }
  }

  const nextPage = () => {
    if (pageNumber < (numPages || 0)) {
      const newPageNumber = pageNumber + 1
      setPageNumber(newPageNumber)
      setFoundTextPositions([])
      if (highlight.searchText && pdfDocumentRef.current) {
        searchTextInPage(pdfDocumentRef.current, newPageNumber, highlight.searchText)
      }
    }
  }

  const prevPage = () => {
    if (pageNumber > 1) {
      const newPageNumber = pageNumber - 1
      setPageNumber(newPageNumber)
      setFoundTextPositions([])
      if (highlight.searchText && pdfDocumentRef.current) {
        searchTextInPage(pdfDocumentRef.current, newPageNumber, highlight.searchText)
      }
    }
  }

  const zoomIn = () => {
    setScale(scale + 0.2)
  }

  const zoomOut = () => {
    if (scale > 0.6) {
      setScale(scale - 0.2)
    }
  }

  // Add highlight overlay after page renders
  useEffect(() => {
    if (!isLoading && canvasRef.current) {
      const timer = setTimeout(() => {
        const canvas = canvasRef.current?.querySelector("canvas")
        if (canvas) {
          const container = canvas.parentElement
          if (container) {
            // Remove any existing highlights
            const existingHighlights = container.querySelectorAll(".pdf-highlight")
            existingHighlights.forEach((el) => el.remove())

            // Add highlights for found text positions
            foundTextPositions.forEach((pos, index) => {
              const highlightEl = document.createElement("div")
              highlightEl.className = "pdf-highlight"
              highlightEl.style.position = "absolute"
              highlightEl.style.top = `${pos.top * scale}px`
              highlightEl.style.left = `${pos.left * scale}px`
              highlightEl.style.width = `${pos.width * scale}px`
              highlightEl.style.height = `${pos.height * scale}px`
              highlightEl.style.backgroundColor = "rgba(255, 255, 0, 0.4)"
              highlightEl.style.pointerEvents = "none"
              highlightEl.style.zIndex = "10"
              highlightEl.style.border = "2px solid orange"

              // Add highlight to container
              container.style.position = "relative"
              container.appendChild(highlightEl)
            })

            // If we have a predefined position from the highlight prop, use that too
            if (highlight.position) {
              const highlightEl = document.createElement("div")
              highlightEl.className = "pdf-highlight"
              highlightEl.style.position = "absolute"
              highlightEl.style.top = `${highlight.position.top * scale}px`
              highlightEl.style.left = `${highlight.position.left * scale}px`
              highlightEl.style.width = `${highlight.position.width * scale}px`
              highlightEl.style.height = `${highlight.position.height * scale}px`
              highlightEl.style.backgroundColor = "rgba(255, 0, 0, 0.2)"
              highlightEl.style.pointerEvents = "none"
              highlightEl.style.zIndex = "10"
              highlightEl.style.border = "2px solid red"

              // Add highlight to container
              container.appendChild(highlightEl)
            }
          }
        }
      }, 500) // Small delay to ensure PDF is fully rendered

      return () => clearTimeout(timer)
    }
  }, [isLoading, pageNumber, highlight, scale, foundTextPositions])

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-2 border-b">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={prevPage} disabled={pageNumber <= 1}>
            Vorherige
          </Button>
          <span className="text-sm">
            Seite {pageNumber} von {numPages || "..."}
          </span>
          <Button variant="outline" size="sm" onClick={nextPage} disabled={pageNumber >= (numPages || 0)}>
            Nächste
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {isSearching && <Loader2 className="h-4 w-4 animate-spin text-gray-500" />}
          {!isSearching && foundTextPositions.length > 0 && (
            <span className="text-xs text-green-600">{foundTextPositions.length} Treffer</span>
          )}
          <Button variant="outline" size="sm" onClick={zoomOut}>
            -
          </Button>
          <span className="text-sm">{Math.round(scale * 100)}%</span>
          <Button variant="outline" size="sm" onClick={zoomIn}>
            +
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 flex justify-center" ref={canvasRef}>
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        )}

        <Document
          file={pdfUrl}
          onLoadSuccess={({ numPages }) =>
            onDocumentLoadSuccess({ numPages, pdfDocument: pdfjs.getDocument(pdfUrl).promise })
          }
          loading={<Loader2 className="h-8 w-8 animate-spin text-gray-500" />}
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            renderTextLayer={true}
            renderAnnotationLayer={false}
            onRenderSuccess={() => {
              if (highlight.searchText && pdfDocumentRef.current) {
                searchTextInPage(pdfDocumentRef.current, pageNumber, highlight.searchText)
              }
            }}
          />
        </Document>
      </div>
    </div>
  )
}
