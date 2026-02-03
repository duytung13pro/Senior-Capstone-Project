"use client"

import React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sidebar } from "@/components/Sidebar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  FileText,
  Video,
  Link2,
  ImageIcon,
  Download,
  ExternalLink,
  FolderOpen,
  Filter,
  BookOpen,
} from "lucide-react"

const resources = [
  {
    id: "1",
    title: "Pinyin Chart PDF",
    type: "pdf",
    course: "Beginner Mandarin",
    courseId: "1",
    description: "Complete pinyin chart with all tones and pronunciation guide",
    fileSize: "2.4 MB",
    downloads: 156,
    uploadedBy: "Teacher Wang",
    uploadedAt: "2024-03-15",
    tags: ["pinyin", "pronunciation", "reference"],
  },
  {
    id: "2",
    title: "Character Stroke Order Videos",
    type: "video",
    course: "Beginner Mandarin",
    courseId: "1",
    description: "Video collection showing proper stroke order for 100 basic characters",
    fileSize: "150 MB",
    downloads: 89,
    uploadedBy: "Teacher Wang",
    uploadedAt: "2024-03-20",
    tags: ["characters", "writing", "stroke-order"],
  },
  {
    id: "3",
    title: "HSK 4 Vocabulary List",
    type: "pdf",
    course: "HSK 4 Preparation",
    courseId: "3",
    description: "Complete vocabulary list for HSK Level 4 with pinyin and examples",
    fileSize: "1.8 MB",
    downloads: 234,
    uploadedBy: "Teacher Zhang",
    uploadedAt: "2024-04-01",
    tags: ["vocabulary", "hsk4", "study-guide"],
  },
  {
    id: "4",
    title: "Conversation Practice Audio",
    type: "video",
    course: "Intermediate Conversation",
    courseId: "2",
    description: "Audio recordings of native speaker conversations at intermediate level",
    fileSize: "85 MB",
    downloads: 67,
    uploadedBy: "Teacher Li",
    uploadedAt: "2024-04-10",
    tags: ["listening", "conversation", "audio"],
  },
  {
    id: "5",
    title: "Chinese Grammar Reference",
    type: "link",
    course: "Beginner Mandarin",
    courseId: "1",
    description: "External link to comprehensive Chinese grammar resource",
    fileSize: null,
    downloads: 112,
    uploadedBy: "Teacher Wang",
    uploadedAt: "2024-04-15",
    tags: ["grammar", "reference", "external"],
  },
  {
    id: "6",
    title: "Calligraphy Brush Technique Guide",
    type: "pdf",
    course: "Chinese Calligraphy",
    courseId: "4",
    description: "Illustrated guide to brush holding and basic strokes",
    fileSize: "5.2 MB",
    downloads: 45,
    uploadedBy: "Teacher Chen",
    uploadedAt: "2024-04-20",
    tags: ["calligraphy", "technique", "guide"],
  },
  {
    id: "7",
    title: "Character Practice Sheets",
    type: "pdf",
    course: "Beginner Mandarin",
    courseId: "1",
    description: "Printable character practice sheets with grid lines",
    fileSize: "3.1 MB",
    downloads: 198,
    uploadedBy: "Teacher Wang",
    uploadedAt: "2024-05-01",
    tags: ["practice", "writing", "printable"],
  },
  {
    id: "8",
    title: "HSK 4 Mock Exam",
    type: "pdf",
    course: "HSK 4 Preparation",
    courseId: "3",
    description: "Full-length practice exam with answer key",
    fileSize: "4.5 MB",
    downloads: 156,
    uploadedBy: "Teacher Zhang",
    uploadedAt: "2024-05-10",
    tags: ["exam", "practice", "hsk4"],
  },
]

const typeIcons: Record<string, React.ElementType> = {
  pdf: FileText,
  video: Video,
  link: Link2,
  image: ImageIcon,
  document: FileText,
}

const typeColors: Record<string, string> = {
  pdf: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  video: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  link: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  image: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  document: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
}

export default function StudentResourcesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [courseFilter, setCourseFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")

  const filteredResources = resources.filter((resource) => {
    const matchesSearch =
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCourse = courseFilter === "all" || resource.courseId === courseFilter
    const matchesType = typeFilter === "all" || resource.type === typeFilter
    return matchesSearch && matchesCourse && matchesType
  })

  const resourcesByCourse = resources.reduce(
    (acc, resource) => {
      if (!acc[resource.course]) {
        acc[resource.course] = []
      }
      acc[resource.course].push(resource)
      return acc
    },
    {} as Record<string, typeof resources>
  )

  const allTags = [...new Set(resources.flatMap((r) => r.tags))].sort()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Resources</h1>
        <p className="text-muted-foreground">Access course materials and learning resources</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={courseFilter} onValueChange={setCourseFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Courses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            <SelectItem value="1">Beginner Mandarin</SelectItem>
            <SelectItem value="2">Intermediate Conversation</SelectItem>
            <SelectItem value="3">HSK 4 Preparation</SelectItem>
            <SelectItem value="4">Chinese Calligraphy</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="pdf">PDF</SelectItem>
            <SelectItem value="video">Video</SelectItem>
            <SelectItem value="link">Link</SelectItem>
            <SelectItem value="image">Image</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        {allTags.slice(0, 10).map((tag) => (
          <Badge
            key={tag}
            variant="outline"
            className="cursor-pointer hover:bg-muted"
            onClick={() => setSearchQuery(tag)}
          >
            {tag}
          </Badge>
        ))}
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Resources ({filteredResources.length})</TabsTrigger>
          <TabsTrigger value="by-course">By Course</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {filteredResources.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No resources found</h3>
                <p className="text-muted-foreground">Try adjusting your search or filters</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredResources.map((resource) => {
                const Icon = typeIcons[resource.type] || FileText
                return (
                  <Card key={resource.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${typeColors[resource.type]}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base truncate">{resource.title}</CardTitle>
                          <CardDescription className="text-xs">{resource.course}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground line-clamp-2">{resource.description}</p>

                      <div className="flex flex-wrap gap-1">
                        {resource.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{resource.uploadedBy}</span>
                        <span>{resource.fileSize || "External"}</span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-xs text-muted-foreground">{resource.downloads} downloads</span>
                        <Button size="sm" variant={resource.type === "link" ? "outline" : "default"}>
                          {resource.type === "link" ? (
                            <>
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Open
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="by-course">
          <div className="space-y-6">
            {Object.entries(resourcesByCourse).map(([course, courseResources]) => (
              <Card key={course}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <CardTitle>{course}</CardTitle>
                  </div>
                  <CardDescription>{courseResources.length} resources available</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {courseResources.map((resource) => {
                      const Icon = typeIcons[resource.type] || FileText
                      return (
                        <div
                          key={resource.id}
                          className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                        >
                          <div className={`p-2 rounded-lg ${typeColors[resource.type]}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{resource.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {resource.fileSize || "External link"} | {resource.downloads} downloads
                            </div>
                          </div>
                          <Button size="sm" variant="ghost">
                            {resource.type === "link" ? (
                              <ExternalLink className="h-4 w-4" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
