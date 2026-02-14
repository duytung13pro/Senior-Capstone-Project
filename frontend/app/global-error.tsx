'use client'

import React from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center">
          <h2 className="text-2xl font-bold">Something went wrong!</h2>
          <p className="mt-4 text-gray-600">
            {error.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => reset()}
            className="mt-6 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
