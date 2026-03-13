"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

// Required CSS for the text layer to align correctly over the canvas
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

// Configure the PDF.js worker (Required for Next.js)
// Note: react-pdf v9+ uses .mjs for the worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  fileUrl: string;
  onTextSelect?: (text: string) => void;
}

export default function PdfViewer({ fileUrl, onTextSelect }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>();

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  // Capture the double-click event
  const handleDoubleClick = () => {
    const selection = window.getSelection();
    if (selection) {
      const selectedText = selection.toString().trim();
      if (selectedText && onTextSelect) {
        onTextSelect(selectedText);
      }
    }
  };

  return (
    <div 
      onDoubleClick={handleDoubleClick} 
      className="flex flex-col items-center bg-gray-100 p-4 overflow-auto max-h-screen"
    >
      <Document
        file={fileUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        className="shadow-lg"
      >
        {Array.from(new Array(numPages), (el, index) => (
          <Page
            key={`page_${index + 1}`}
            pageNumber={index + 1}
            renderTextLayer={true} // Crucial: Enables the selectable DOM text
            renderAnnotationLayer={false} // Set to true if you need PDF links/annotations
            className="mb-4"
            width={800} // Set a fixed width or make it responsive
          />
        ))}
      </Document>
    </div>
  );
}
