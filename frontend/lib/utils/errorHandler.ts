export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export function handleError(error: unknown) {
  if (error instanceof ApiError) {
    return {
      statusCode: error.statusCode,
      message: error.message,
    }
  }

  if (error instanceof Error) {
    return {
      statusCode: 500,
      message: error.message,
    }
  }

  return {
    statusCode: 500,
    message: "An unexpected error occurred",
  }
}
