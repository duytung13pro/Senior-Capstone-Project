import type { IUser } from "@/lib/models/User"
import type { ICourse } from "@/lib/models/Course"
import type { IModule } from "@/lib/models/Module"
import type { IEnrollment } from "@/lib/models/Enrollment"

export type { IUser, ICourse, IModule, IEnrollment }

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}
