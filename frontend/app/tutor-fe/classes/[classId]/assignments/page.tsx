"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function AssignmentsPage() {
  const { classId } = useParams();
  const router = useRouter();

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push(`/tutor-fe/classes/${classId}`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Class
          </Button>

          <h1 className="text-3xl font-bold">Assignments</h1>
        </div>
      </div>

      {/* Content placeholder */}
      <div className="rounded-md border p-6 text-muted-foreground">
        Assignments for class: <span className="font-mono">{classId}</span>
      </div>
    </div>
  );
}
