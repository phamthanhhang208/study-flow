import type { StudySession } from "./api/types"

export function exportToMarkdown(session: StudySession): string {
  const lines: string[] = []

  lines.push(`# ${session.topic}`)
  lines.push("")
  lines.push(`*Created: ${new Date(session.createdAt).toLocaleDateString()}*`)
  lines.push("")

  // Learning path
  if (session.learningPath) {
    const lp = session.learningPath
    if (lp.summary) {
      lines.push(lp.summary)
      lines.push("")
    }

    for (const section of lp.sections) {
      lines.push(`## ${section.title}`)
      lines.push("")
      lines.push(section.content)
      lines.push("")

      if (section.resources.length > 0) {
        lines.push("**Resources:**")
        for (const r of section.resources) {
          lines.push(`- [${r.title}](${r.url})${r.snippet ? ` — ${r.snippet}` : ""}`)
        }
        lines.push("")
      }
    }
  }

  // Q&A history
  if (session.responses.length > 0) {
    lines.push("---")
    lines.push("")
    lines.push("## Questions & Answers")
    lines.push("")

    for (const response of session.responses) {
      lines.push(`### Q: ${response.query}`)
      lines.push("")
      lines.push(response.answer)
      lines.push("")

      if (response.citations.length > 0) {
        lines.push("**Sources:**")
        for (const c of response.citations) {
          lines.push(`- [${c.title}](${c.url})`)
        }
        lines.push("")
      }
    }
  }

  return lines.join("\n")
}

export function downloadMarkdown(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function exportSession(session: StudySession) {
  const md = exportToMarkdown(session)
  const safeName = session.topic.replace(/[^a-zA-Z0-9 -]/g, "").replace(/\s+/g, "-").toLowerCase()
  downloadMarkdown(md, `${safeName}.md`)
}

export function exportAllSessions(sessions: StudySession[]) {
  const parts = sessions.map((s) => exportToMarkdown(s))
  const combined = parts.join("\n\n---\n\n")
  downloadMarkdown(combined, "studyflow-export.md")
}
