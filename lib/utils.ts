import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get a random message from an array of strings
 * @param messages - Array of message strings
 * @returns A random string from the array, or empty string if array is empty
 */
export function getRandomMessage(messages: string[]): string {
  if (!messages || messages.length === 0) {
    return ""
  }
  return messages[Math.floor(Math.random() * messages.length)]
}
