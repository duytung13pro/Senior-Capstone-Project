"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText, Film, ImageIcon, Music, Plus, Search, Share2, Download, Trash, ArrowLeft, Loader2, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import dynamic from "next/dynamic"

const PdfViewer = dynamic(() => import("@/components/pdf-viewer"), { ssr: false })

const resources = [
  {
    id: "1",
    name: "Basic Characters Worksheet",
    type: "PDF",
    class: "Beginner Mandarin",
    date: "May 15, 2023",
    size: "2.4 MB",
    icon: FileText,
    url: "/media/sample.pdf",
  },
  {
    id: "2",
    name: "Conversation Practice Audio",
    type: "Audio",
    class: "Intermediate Conversation",
    date: "May 12, 2023",
    size: "15.8 MB",
    icon: Music,
  },
  {
    id: "3",
    name: "Writing Techniques Presentation",
    type: "Slide",
    class: "Advanced Writing",
    date: "May 10, 2023",
    size: "8.2 MB",
    icon: ImageIcon,
  },
  {
    id: "4",
    name: "Business Vocabulary List",
    type: "PDF",
    class: "Business Mandarin",
    date: "May 8, 2023",
    size: "1.5 MB",
    icon: FileText,
  },
  {
    id: "5",
    name: "HSK 4 Practice Test",
    type: "PDF",
    class: "HSK 4 Preparation",
    date: "May 5, 2023",
    size: "3.7 MB",
    icon: FileText,
  },
  {
    id: "6",
    name: "Chinese Culture Video",
    type: "Video",
    class: "All Classes",
    date: "May 3, 2023",
    size: "45.2 MB",
    icon: Film,
  },
  {
    id: "7",
    name: "Pronunciation Guide",
    type: "PDF",
    class: "Beginner Mandarin",
    date: "April 28, 2023",
    size: "4.1 MB",
    icon: FileText,
  },
  {
    id: "8",
    name: "Grammar Exercises",
    type: "PDF",
    class: "Intermediate Conversation",
    date: "April 25, 2023",
    size: "2.9 MB",
    icon: FileText,
  },
]

export function ResourcesPage() {
  const [filter, setFilter] = useState({
    type: "all",
    class: "all",
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedResource, setSelectedResource] = useState<any>(null)
  const [translationResult, setTranslationResult] = useState<{ text: string; explanation: string } | null>(null)
  const [isTranslating, setIsTranslating] = useState(false)

  const handleResourceClick = (resource: any) => {
    if (resource.type === "PDF") {
      // In a real app, this URL would come from the backend.
      // For demo, we assume the resource has a 'url' property or we use a placeholder.
      if (!resource.url) {
        alert("This PDF does not have a valid URL for the demo.")
        return
      }
      setSelectedResource(resource)
      setTranslationResult(null)
    }
  }

  const handleTextSelect = async (text: string) => {
    if (!text) return
    setIsTranslating(true)
    setTranslationResult(null) // Clear previous result
    try {
      // Call AI Service Translate Endpoint
      const response = await fetch("http://localhost:8000/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          courseId: selectedResource?.class || "general",
          targetLanguage: "English"
        })
      })
      
      const data = await response.json()
      if (data.explanation) {
        setTranslationResult({ text: text, explanation: data.explanation })
      }
    } catch (error) {
      console.error("Translation error:", error)
    } finally {
      setIsTranslating(false)
    }
  }

  const filteredResources = resources.filter((resource) => {
    const typeMatch = filter.type === "all" || resource.type === filter.type
    const classMatch = filter.class === "all" || resource.class === filter.class
    const searchMatch = searchQuery === "" || resource.name.toLowerCase().includes(searchQuery.toLowerCase())
    return typeMatch && classMatch && searchMatch
  })

  // PDF Viewer View
  if (selectedResource) {
    return (
      <div className="flex flex-col h-[calc(100vh-100px)] gap-4 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setSelectedResource(null)}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <div>
              <h2 className="text-xl font-bold">{selectedResource.name}</h2>
              <p className="text-sm text-muted-foreground">Double-click any text to translate/explain with AI</p>
            </div>
          </div>
        </div>

        <div className="flex-1 border rounded-lg overflow-hidden bg-gray-50 relative flex justify-center">
            <div className="w-full h-full overflow-auto flex justify-center p-8">
               <PdfViewer 
                 fileUrl={selectedResource.url} 
                 onTextSelect={handleTextSelect} 
               />
            </div>

            {/* AI Translation Overlay */}
            {(isTranslating || translationResult) && (
              <div className="absolute top-4 right-4 z-50 w-80 shadow-2xl">
                <Card className="border-2 border-primary/20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-primary/5">
                    <CardTitle className="text-sm font-medium">
                      AI Explanation
                    </CardTitle>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setTranslationResult(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {isTranslating ? (
                      <div className="flex flex-col items-center justify-center p-4">
                         <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                         <p className="text-xs text-muted-foreground">Analyzing context...</p>
                      </div>
                    ) : (
                      <ScrollArea className="h-[200px] w-full pr-4">
                         <div className="space-y-2">
                           <div className="bg-muted p-2 rounded text-xs font-mono mb-2">
                             "{translationResult?.text}"
                           </div>
                           <p className="text-sm leading-relaxed">
                             {translationResult?.explanation}
                           </p>
                         </div>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Resources & Materials</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Upload Material
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload New Material</DialogTitle>
              <DialogDescription>Upload a new resource for your students.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="file">File</Label>
                <Input id="file" type="file" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Enter resource name" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Type</Label>
                <Select>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="slide">Slide</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="class">Associated Class</Label>
                <Select>
                  <SelectTrigger id="class">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    <SelectItem value="beginner">Beginner Mandarin</SelectItem>
                    <SelectItem value="intermediate">Intermediate Conversation</SelectItem>
                    <SelectItem value="advanced">Advanced Writing</SelectItem>
                    <SelectItem value="business">Business Mandarin</SelectItem>
                    <SelectItem value="hsk4">HSK 4 Preparation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input id="tags" placeholder="Grammar, Vocabulary, Culture, etc." />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Upload</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 md:max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search resources..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={filter.type} onValueChange={(value) => setFilter({ ...filter, type: value })}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="PDF">PDF</SelectItem>
              <SelectItem value="Audio">Audio</SelectItem>
              <SelectItem value="Video">Video</SelectItem>
              <SelectItem value="Slide">Slide</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filter.class} onValueChange={(value) => setFilter({ ...filter, class: value })}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              <SelectItem value="All Classes">All Classes</SelectItem>
              <SelectItem value="Beginner Mandarin">Beginner Mandarin</SelectItem>
              <SelectItem value="Intermediate Conversation">Intermediate Conversation</SelectItem>
              <SelectItem value="Advanced Writing">Advanced Writing</SelectItem>
              <SelectItem value="Business Mandarin">Business Mandarin</SelectItem>
              <SelectItem value="HSK 4 Preparation">HSK 4 Preparation</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="hidden md:table-cell">Class</TableHead>
              <TableHead className="hidden md:table-cell">Date</TableHead>
              <TableHead className="hidden md:table-cell">Size</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredResources.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No resources found.
                </TableCell>
              </TableRow>
            ) : (
              filteredResources.map((resource) => (
                <TableRow key={resource.id}>
                  <TableCell>
                    <div 
                      className={`flex items-center gap-3 ${resource.type === "PDF" ? "cursor-pointer hover:bg-muted/50 rounded p-1 -m-1 transition-colors" : ""}`}
                      onClick={() => handleResourceClick(resource)}
                    >
                      <resource.icon className={`h-5 w-5 text-muted-foreground ${resource.type === "PDF" ? "text-primary" : ""}`} />
                      <div className={`font-medium ${resource.type === "PDF" ? "text-primary underline decoration-dotted underline-offset-4" : ""}`}>
                        {resource.name}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        resource.type === "PDF"
                          ? "border-red-200 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400"
                          : resource.type === "Audio"
                            ? "border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400"
                            : resource.type === "Video"
                              ? "border-purple-200 bg-purple-50 text-purple-600 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-400"
                              : "border-green-200 bg-green-50 text-green-600 dark:border-green-800 dark:bg-green-950 dark:text-green-400"
                      }
                    >
                      {resource.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{resource.class}</TableCell>
                  <TableCell className="hidden md:table-cell">{resource.date}</TableCell>
                  <TableCell className="hidden md:table-cell">{resource.size}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon">
                        <Download className="h-4 w-4" />
                        <span className="sr-only">Download</span>
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Share2 className="h-4 w-4" />
                        <span className="sr-only">Share</span>
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Trash className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}