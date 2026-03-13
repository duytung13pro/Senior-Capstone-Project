"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, RefreshCcw, Trash2, BookMarked } from "lucide-react"

interface Flashcard {
  _id: string
  front: string
  back: string
  pronunciation?: string
  sourceDocumentTitle?: string
  sourceText?: string
  createdAt: string
}

export default function FlashcardsPage() {
  const [cards, setCards] = useState<Flashcard[]>([])
  const [loading, setLoading] = useState(true)
  const [sourceFilter, setSourceFilter] = useState("all")
  const [sources, setSources] = useState<string[]>([])
  const [current, setCurrent] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [known, setKnown] = useState<Set<string>>(new Set())
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchCards = useCallback(async (source?: string) => {
    setLoading(true)
    try {
      const studentId = typeof window !== "undefined" ? localStorage.getItem("userId") : null
      if (!studentId) { setLoading(false); return }
      const params = new URLSearchParams({ studentId })
      if (source && source !== "all") params.append("source", source)
      const res = await fetch(`/api/student/flashcards?${params}`)
      const data = await res.json()
      const fetched: Flashcard[] = data.flashcards || []
      setCards(fetched)

      // Build unique sources list from all cards
      if (!source || source === "all") {
        const uniq = [...new Set(fetched.map((c) => c.sourceDocumentTitle).filter(Boolean))] as string[]
        setSources(uniq)
      }
      setCurrent(0)
      setFlipped(false)
    } catch (e) {
      console.error("Fetch flashcards error:", e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCards()
  }, [fetchCards])

  const handleSourceChange = (val: string) => {
    setSourceFilter(val)
    fetchCards(val === "all" ? undefined : val)
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const studentId = localStorage.getItem("userId")
      await fetch(`/api/student/flashcards?id=${id}&studentId=${studentId}`, { method: "DELETE" })
      setCards((prev) => prev.filter((c) => c._id !== id))
      if (current >= cards.length - 1) setCurrent(Math.max(0, cards.length - 2))
    } catch (e) {
      console.error("Delete error:", e)
    } finally {
      setDeletingId(null)
    }
  }

  const advance = (wasKnown: boolean) => {
    if (wasKnown) setKnown((prev) => new Set([...prev, cards[current]._id]))
    setFlipped(false)
    setTimeout(() => setCurrent((prev) => (prev + 1 < cards.length ? prev + 1 : prev)), 100)
  }

  const resetSession = () => {
    setKnown(new Set())
    setCurrent(0)
    setFlipped(false)
  }

  // ── Empty state ──
  if (!loading && cards.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Flashcards</h1>
          <p className="text-muted-foreground">Review words saved from your reading materials</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <BookMarked className="h-14 w-14 text-muted-foreground" />
            <h3 className="text-xl font-semibold">No flashcards yet</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              Open a PDF in <strong>Resources</strong>, double-click any text to translate it,
              then tap the bookmark icon to save it here.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const card = cards[current]
  const progress = cards.length > 0 ? Math.round((known.size / cards.length) * 100) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Flashcards</h1>
          <p className="text-muted-foreground">Review words saved from your reading materials</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={sourceFilter} onValueChange={handleSourceChange}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="All Sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              {sources.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={resetSession} title="Restart session">
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{current + 1} / {cards.length}</span>
              <span>{progress}% known</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Dot indicators */}
          <div className="flex justify-center gap-1.5 flex-wrap">
            {cards.map((c, i) => (
              <button
                key={c._id}
                onClick={() => { setCurrent(i); setFlipped(false) }}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  known.has(c._id)
                    ? "bg-green-500"
                    : i === current
                    ? "bg-primary"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
                aria-label={`Go to card ${i + 1}`}
              />
            ))}
          </div>

          {/* All-done state */}
          {known.size === cards.length && cards.length > 0 ? (
            <Card className="text-center">
              <CardContent className="space-y-4 pt-10 pb-10">
                <div className="text-5xl">🎉</div>
                <h2 className="text-2xl font-bold">Session Complete!</h2>
                <p className="text-muted-foreground">
                  You marked <strong>{known.size}</strong> of <strong>{cards.length}</strong> cards as known.
                </p>
                <Button onClick={resetSession} className="mt-2">
                  <RefreshCcw className="h-4 w-4 mr-2" /> Review Again
                </Button>
              </CardContent>
            </Card>
          ) : card ? (
            <div className="flex justify-center">
              <div className="w-full max-w-lg">
                {/* 3-D flip card */}
                <div
                  className="relative cursor-pointer select-none"
                  style={{ height: 280, perspective: 1000 }}
                  onClick={() => setFlipped((f) => !f)}
                >
                  <div
                    className="absolute inset-0 transition-transform duration-500"
                    style={{
                      transformStyle: "preserve-3d",
                      transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
                    }}
                  >
                    {/* Front */}
                    <div
                      className="absolute inset-0 flex flex-col items-center justify-center bg-card border-2 border-primary/20 hover:border-primary/40 rounded-xl shadow-lg p-6 gap-2 transition-colors"
                      style={{ backfaceVisibility: "hidden" }}
                    >
                      <Badge variant="secondary" className="mb-2">Front</Badge>
                      <p className="text-5xl font-bold text-center text-primary">{card.front}</p>
                      {card.pronunciation && (
                        <p className="text-lg text-muted-foreground">{card.pronunciation}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-4">Click to reveal</p>
                    </div>

                    {/* Back */}
                    <div
                      className="absolute inset-0 flex flex-col items-center justify-center bg-green-50/40 dark:bg-green-950/10 border-2 border-green-500/40 rounded-xl shadow-lg p-6 gap-2"
                      style={{
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                      }}
                    >
                      <Badge variant="default" className="mb-2 bg-green-600">Translation</Badge>
                      <p className="text-sm text-center leading-relaxed">{card.back}</p>
                      {card.sourceDocumentTitle && (
                        <p className="text-xs text-muted-foreground mt-3">
                          From: <em>{card.sourceDocumentTitle}</em>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 mt-4 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => advance(false)}
                    className="flex-1 max-w-[180px] border-orange-400 text-orange-600 hover:bg-orange-50"
                  >
                    Still Learning
                  </Button>
                  <Button
                    onClick={() => advance(true)}
                    className="flex-1 max-w-[180px] bg-green-600 hover:bg-green-700"
                  >
                    Got It ✓
                  </Button>
                </div>

                {/* Delete button */}
                <div className="flex justify-center mt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive/80 text-xs"
                    disabled={deletingId === card._id}
                    onClick={(e) => { e.stopPropagation(); handleDelete(card._id) }}
                  >
                    {deletingId === card._id ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <Trash2 className="h-3 w-3 mr-1" />
                    )}
                    Remove card
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
