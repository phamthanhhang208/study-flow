import type { StudySession, ModuleConversation } from "./api/types"

export function exportToMarkdown(session: StudySession): string {
  const lines: string[] = []

  lines.push(`# ${session.topic}`)
  lines.push("")
  lines.push(`*Created: ${new Date(session.createdAt).toLocaleDateString()}*`)
  lines.push("")

  // Learning path
  if (session.learningPath) {
    const lp = session.learningPath
    if (lp.overview) {
      lines.push(lp.overview)
      lines.push("")
    }

    for (const mod of lp.subModules) {
      lines.push(`## ${mod.title}`)
      lines.push("")
      lines.push(mod.description)
      lines.push("")

      if (mod.articles.length > 0) {
        lines.push("**Articles:**")
        for (const a of mod.articles) {
          lines.push(`- [${a.title}](${a.url})${a.snippet ? ` — ${a.snippet}` : ""}`)
        }
        lines.push("")
      }

      if (mod.videos.length > 0) {
        lines.push("**Videos:**")
        for (const v of mod.videos) {
          lines.push(`- [${v.title}](${v.url})${v.channelName ? ` — ${v.channelName}` : ""}`)
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

export function exportConversationToMarkdown(
  conversation: ModuleConversation,
  moduleName: string,
): string {
  const lines: string[] = []

  lines.push(`# Conversation: ${moduleName}`)
  lines.push("")
  lines.push(`*${conversation.messages.length} messages*`)
  lines.push("")
  lines.push("---")
  lines.push("")

  for (const message of conversation.messages) {
    const role = message.role === "user" ? "**You**" : "**Tutor**"
    const timestamp = new Date(message.timestamp).toLocaleString()

    lines.push(`### ${role} - ${timestamp}`)
    lines.push("")
    lines.push(message.content)
    lines.push("")

    if (message.citations && message.citations.length > 0) {
      lines.push("**Sources:**")
      for (const c of message.citations) {
        lines.push(`- [${c.title}](${c.url})`)
      }
      lines.push("")
    }

    lines.push("---")
    lines.push("")
  }

  return lines.join("\n")
}

export function downloadConversation(
  conversation: ModuleConversation,
  moduleName: string,
) {
  const md = exportConversationToMarkdown(conversation, moduleName)
  const safeName = moduleName
    .replace(/[^a-zA-Z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase()
  downloadMarkdown(md, `conversation-${safeName}.md`)
}

export function exportAllSessions(sessions: StudySession[]) {
  const parts = sessions.map((s) => exportToMarkdown(s))
  const combined = parts.join("\n\n---\n\n")
  downloadMarkdown(combined, "studyflow-export.md")
}
