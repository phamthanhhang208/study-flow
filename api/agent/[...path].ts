import type { VercelRequest, VercelResponse } from "@vercel/node"

const TARGET = "https://api.you.com/v1"

export const config = {
  supportsResponseStreaming: true,
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { path } = req.query
  const subpath = Array.isArray(path) ? path.join("/") : path || ""
  const url = `${TARGET}/${subpath}`

  const apiKey =
    (req.headers["authorization"] as string)?.replace("Bearer ", "") ||
    process.env.YOUCOM_API_KEY ||
    process.env.VITE_YOUCOM_API_KEY ||
    ""

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  }

  const isStreaming = req.body?.stream === true

  try {
    const response = await fetch(url, {
      method: req.method || "POST",
      headers,
      body: req.method !== "GET" && req.method !== "HEAD" ? JSON.stringify(req.body) : undefined,
    })

    if (!response.ok) {
      const text = await response.text()
      res.status(response.status).send(text)
      return
    }

    if (isStreaming && response.body) {
      // Stream SSE response
      res.setHeader("Content-Type", "text/event-stream")
      res.setHeader("Cache-Control", "no-cache")
      res.setHeader("Connection", "keep-alive")

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          res.write(chunk)
        }
      } finally {
        reader.releaseLock()
      }
      res.end()
    } else {
      // Non-streaming JSON response
      const contentType = response.headers.get("content-type")
      if (contentType) res.setHeader("Content-Type", contentType)
      const data = await response.text()
      res.status(response.status).send(data)
    }
  } catch (err) {
    res.status(502).json({ error: "Proxy error", message: (err as Error).message })
  }
}
