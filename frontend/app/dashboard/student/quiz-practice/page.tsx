"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, XCircle, BrainCircuit, RotateCcw, Trophy, Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

// Available study topics matching the real PDF documents
const TOPICS = [
  { id: "pinyin", label: "Pinyin & Pronunciation", topic: "Pinyin and Chinese pronunciation tones" },
  { id: "hsk4",  label: "HSK 4 Vocabulary",       topic: "HSK 4 vocabulary words and usage"     },
  { id: "grammar", label: "Chinese Grammar",       topic: "Chinese grammar patterns and sentence structure" },
  { id: "greetings", label: "Greetings & Phrases", topic: "Common Chinese greetings and polite phrases" },
  { id: "food",  label: "Food & Daily Life",       topic: "Chinese food vocabulary and daily life expressions" },
]

interface Question {
  question: string
  options: string[]
  correct: number
  explanation: string
}

type QuizState = "setup" | "loading" | "question" | "results"

export default function QuizPracticePage() {
  const [state, setState] = useState<QuizState>("setup")
  const [selectedTopic, setSelectedTopic] = useState(TOPICS[0].id)
  const [numQuestions, setNumQuestions] = useState("5")
  const [questions, setQuestions] = useState<Question[]>([])
  const [loadError, setLoadError] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  const [answers, setAnswers] = useState<boolean[]>([])

  const topicObj = TOPICS.find((t) => t.id === selectedTopic) || TOPICS[0]
  const current = questions[currentIndex]
  const score = answers.filter(Boolean).length

  // ── Generate quiz via AI service ──
  const handleGenerate = async () => {
    setState("loading")
    setLoadError("")
    setQuestions([])
    setCurrentIndex(0)
    setSelectedOption(null)
    setAnswered(false)
    setAnswers([])

    try {
      const res = await fetch("http://localhost:8000/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: "1",
          topic: topicObj.topic,
          num_questions: parseInt(numQuestions, 10),
        }),
      })
      if (!res.ok) throw new Error(`AI service error: ${res.status}`)
      const data = await res.json()
      // Map AI response to internal format
      const mapped: Question[] = (data.questions || []).map((q: any) => ({
        question: q.question_text,
        options: (q.options || []).map((o: any) => o.text),
        correct: (q.options || []).findIndex((o: any) => o.is_correct),
        explanation: q.explanation || "",
      }))
      if (mapped.length === 0) throw new Error("No questions returned")
      setQuestions(mapped)
      setState("question")
    } catch (err: any) {
      console.error("Quiz generation error:", err)
      setLoadError(err.message || "Could not connect to AI service. Please make sure it is running.")
      setState("setup")
    }
  }

  const handleSelect = (index: number) => {
    if (answered) return
    setSelectedOption(index)
    setAnswered(true)
    setAnswers([...answers, index === current.correct])
  }

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1)
      setSelectedOption(null)
      setAnswered(false)
    } else {
      setState("results")
    }
  }

  const handleReset = () => {
    setState("setup")
    setCurrentIndex(0)
    setSelectedOption(null)
    setAnswered(false)
    setAnswers([])
    setQuestions([])
  }

  // ── Setup screen ──
  if (state === "setup") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BrainCircuit className="h-8 w-8 text-primary" />
            Quiz Practice
          </h1>
          <p className="text-muted-foreground">
            Generate an AI-powered quiz on any topic from your course materials
          </p>
        </div>
        <div className="max-w-lg mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Generate a New Quiz</CardTitle>
              <CardDescription>
                Choose a topic and how many questions you want to practice
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium">Study Topic</label>
                <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a topic" />
                  </SelectTrigger>
                  <SelectContent>
                    {TOPICS.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Number of Questions</label>
                <Select value={numQuestions} onValueChange={setNumQuestions}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 questions</SelectItem>
                    <SelectItem value="5">5 questions</SelectItem>
                    <SelectItem value="8">8 questions</SelectItem>
                    <SelectItem value="10">10 questions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {loadError && (
                <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{loadError}</p>
              )}
              <Button onClick={handleGenerate} className="w-full gap-2">
                <BrainCircuit className="h-4 w-4" />
                Generate Quiz
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // ── Loading screen ──
  if (state === "loading") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BrainCircuit className="h-8 w-8 text-primary" />
            Quiz Practice
          </h1>
        </div>
        <div className="max-w-lg mx-auto">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <h3 className="text-lg font-semibold">Generating your quiz…</h3>
              <p className="text-muted-foreground text-sm">
                AI is crafting {numQuestions} questions on <em>{topicObj.label}</em>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // ── Results screen ──
  if (state === "results") {
    const pct = Math.round((score / questions.length) * 100)
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BrainCircuit className="h-8 w-8 text-primary" />
            Quiz Practice
          </h1>
        </div>
        <div className="max-w-lg mx-auto space-y-6">
          <Card className="text-center">
            <CardContent className="pt-10 pb-8 space-y-4">
              <Trophy className="h-12 w-12 text-yellow-500 mx-auto" />
              <h2 className="text-2xl font-bold">Quiz Complete!</h2>
              <p className="text-4xl font-bold text-primary">{score}/{questions.length}</p>
              <Badge
                className="text-base px-4 py-1"
                variant={pct >= 80 ? "default" : pct >= 60 ? "secondary" : "destructive"}
              >
                {pct}% — {pct >= 80 ? "Excellent!" : pct >= 60 ? "Good work" : "Keep practicing"}
              </Badge>
              <Progress value={pct} className="h-3 mt-2" />
            </CardContent>
          </Card>

          {/* Review */}
          {questions.map((q, i) => (
            <Card key={i} className={cn(
              "border-l-4",
              answers[i] ? "border-l-green-500" : "border-l-red-500"
            )}>
              <CardContent className="pt-4 space-y-2">
                <div className="flex items-start gap-2">
                  {answers[i]
                    ? <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                    : <XCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />}
                  <p className="font-medium text-sm">{q.question}</p>
                </div>
                <p className="text-xs text-muted-foreground pl-7">
                  Correct: <strong>{q.options[q.correct]}</strong>
                </p>
                {q.explanation && (
                  <p className="text-xs text-muted-foreground pl-7 italic">{q.explanation}</p>
                )}
              </CardContent>
            </Card>
          ))}

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleReset} className="flex-1 gap-2">
              <RotateCcw className="h-4 w-4" /> New Quiz
            </Button>
            <Button onClick={() => {
              setCurrentIndex(0); setSelectedOption(null);
              setAnswered(false); setAnswers([]); setState("question");
            }} className="flex-1 gap-2">
              <RotateCcw className="h-4 w-4" /> Retry Same Quiz
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ── Question screen ──
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <BrainCircuit className="h-8 w-8 text-primary" />
          Quiz Practice
        </h1>
        <p className="text-muted-foreground">Topic: <em>{topicObj.label}</em></p>
      </div>

      <div className="max-w-2xl mx-auto space-y-4">
        <div className="space-y-1">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Question {currentIndex + 1} of {questions.length}</span>
            <span>{score} correct</span>
          </div>
          <Progress value={((currentIndex) / questions.length) * 100} className="h-2" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{current.question}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {current.options.map((option, i) => {
              const isCorrect = i === current.correct
              const isSelected = i === selectedOption
              return (
                <Button
                  key={i}
                  variant="outline"
                  className={cn(
                    "w-full text-left justify-start h-auto py-3 px-4",
                    answered && isCorrect && "border-green-500 bg-green-50 dark:bg-green-950/20",
                    answered && isSelected && !isCorrect && "border-red-500 bg-red-50 dark:bg-red-950/20",
                    !answered && "hover:bg-muted/50"
                  )}
                  onClick={() => handleSelect(i)}
                  disabled={answered && !isCorrect && !isSelected}
                >
                  <span className="font-semibold mr-2 shrink-0">{["A", "B", "C", "D"][i]}.</span>
                  <span className="flex-1">{option}</span>
                  {answered && isCorrect && (
                    <CheckCircle2 className="ml-2 h-4 w-4 text-green-500 shrink-0" />
                  )}
                  {answered && isSelected && !isCorrect && (
                    <XCircle className="ml-2 h-4 w-4 text-red-500 shrink-0" />
                  )}
                </Button>
              )
            })}

            {answered && current.explanation && (
              <div className="mt-4 p-3 bg-muted rounded-lg text-sm">
                <p className="font-semibold mb-1">💡 Explanation</p>
                <p className="text-muted-foreground">{current.explanation}</p>
              </div>
            )}

            {answered && (
              <Button onClick={handleNext} className="w-full mt-2">
                {currentIndex + 1 < questions.length ? "Next Question →" : "See Results 🏆"}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
