import mongoose from "mongoose";

export interface IFlashcard extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  front: string; // The word (e.g., "你好")
  back: string; // The meaning/definition (e.g., "Hello")
  pronunciation?: string; // Pinyin or IPA
  audioUrl?: string; // Path to generated MP3
  
  // SM-2 Algorithm Fields
  interval: number; // Days until next review
  repetition: number; // Consecutive successful recalls
  easeFactor: number; // Multiplier (starts at 2.5)
  nextReviewDate: Date; // When to show this card again
  
  lastReviewed?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Source tracking (which document the card was created from)
  sourceDocumentTitle?: string;
  sourceDocumentId?: string;
  sourceText?: string;
}

const FlashcardSchema = new mongoose.Schema<IFlashcard>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    front: { type: String, required: true },
    back: { type: String, required: true },
    pronunciation: { type: String },
    audioUrl: { type: String },
    
    // SM-2 Defaults
    interval: { type: Number, default: 0 },
    repetition: { type: Number, default: 0 },
    easeFactor: { type: Number, default: 2.5 },
    nextReviewDate: { type: Date, default: Date.now },
    
    lastReviewed: { type: Date },

    // Source tracking
    sourceDocumentTitle: { type: String },
    sourceDocumentId: { type: String },
    sourceText: { type: String },
  },
  { timestamps: true }
);

// Compound index for efficient querying of due cards per user/course
FlashcardSchema.index({ userId: 1, courseId: 1, nextReviewDate: 1 });

export default mongoose.models.Flashcard || mongoose.model<IFlashcard>("Flashcard", FlashcardSchema);
