import packageJson from "@/package.json"

// Git commit info - these can be set via environment variables at build time
// In production, Vercel automatically provides these via process.env
const getGitInfo = () => {
  // Try to get from environment variables (set by Vercel or build process)
  const commitHash = process.env.VERCEL_GIT_COMMIT_SHA || process.env.NEXT_PUBLIC_GIT_COMMIT_SHA || "main"
  const commitRef = process.env.VERCEL_GIT_COMMIT_REF || process.env.NEXT_PUBLIC_GIT_COMMIT_REF || "main"
  const commitMessage = process.env.VERCEL_GIT_COMMIT_MESSAGE || process.env.NEXT_PUBLIC_GIT_COMMIT_MESSAGE || "chore: update from template"
  const commitAuthorName = process.env.VERCEL_GIT_COMMIT_AUTHOR_NAME || process.env.NEXT_PUBLIC_GIT_COMMIT_AUTHOR_NAME || "goker"
  const commitAuthorLogin = process.env.VERCEL_GIT_COMMIT_AUTHOR_LOGIN || process.env.NEXT_PUBLIC_GIT_COMMIT_AUTHOR_LOGIN || "kodkafa"

  return {
    commitHash,
    commitRef: commitRef.substring(0, 7), // Short commit hash
    commitMessage,
    commitAuthorName,
    commitAuthorLogin,
  }
}

const gitInfo = getGitInfo()

// TrustTheDev configuration
export const TTD = {
  version: packageJson.version || "0.1.0",
  provider: "github" as const,
  repoOwner: "kodkafa",
  repoSlug: "coffeeengine",
  commitHash: gitInfo.commitHash,
  commitRef: gitInfo.commitRef,
  commitMessage: gitInfo.commitMessage,
  commitAuthorName: gitInfo.commitAuthorName,
  commitAuthorLogin: gitInfo.commitAuthorLogin,
}

// Tech stack description
export const TECH_STACK = "Next.js 16, React 19, Tailwind 4, Shadcn UI, Vercel AI SDK, Vercel KV"

// Buy Me a Coffee URL
export const BUY_ME_A_COFFEE = "https://buymeacoffee.com/kodkafa"

