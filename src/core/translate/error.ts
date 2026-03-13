import axios from 'axios'

export function getTranslatorErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const responseMessage = typeof error.response?.data === 'object' && error.response?.data && 'message' in error.response.data
      ? String((error.response.data as Record<string, unknown>).message)
      : undefined
    return responseMessage || error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return String(error)
}
