import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Flashcard from "@/lib/models/Flashcard";

export const dynamic = "force-dynamic";

// GET /api/student/flashcards?studentId=...&source=...
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const studentId =
      request.cookies.get("userId")?.value ||
      searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sourceFilter = searchParams.get("source");
    const query: Record<string, unknown> = { userId: studentId };
    if (sourceFilter) {
      query.sourceDocumentTitle = sourceFilter;
    }

    const flashcards = await Flashcard.find(query).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ flashcards });
  } catch (error) {
    console.error("GET /api/student/flashcards error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/student/flashcards
// Body: { studentId, front, back, pronunciation?, sourceDocumentTitle?, sourceDocumentId?, sourceText? }
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const studentId =
      request.cookies.get("userId")?.value || body.studentId;

    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { front, back, pronunciation, sourceDocumentTitle, sourceDocumentId, sourceText } = body;

    if (!front || !back) {
      return NextResponse.json(
        { error: "front and back are required" },
        { status: 400 }
      );
    }

    const flashcard = await Flashcard.create({
      userId: studentId,
      courseId: "000000000000000000000000", // general / no course
      front,
      back,
      pronunciation: pronunciation || "",
      sourceDocumentTitle: sourceDocumentTitle || "",
      sourceDocumentId: sourceDocumentId || "",
      sourceText: sourceText || "",
    });

    return NextResponse.json({ flashcard }, { status: 201 });
  } catch (error) {
    console.error("POST /api/student/flashcards error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/student/flashcards?id=...&studentId=...
export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const studentId =
      request.cookies.get("userId")?.value ||
      searchParams.get("studentId");
    const flashcardId = searchParams.get("id");

    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!flashcardId) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const deleted = await Flashcard.findOneAndDelete({
      _id: flashcardId,
      userId: studentId,
    });

    if (!deleted) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/student/flashcards error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
