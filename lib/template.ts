export function template(str: string, vars: Record<string, string>): string {
  let result = str
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), value)
  }
  return result
}

