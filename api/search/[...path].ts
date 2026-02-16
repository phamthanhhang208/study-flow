import type { VercelRequest, VercelResponse } from "@vercel/node"

const TARGET = "https://ydc-index.io/v1"

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { path } = req.query
  const subpath = Array.isArray(path) ? path.join("/") : path || ""
  const url = new URL(`${TARGET}/${subpath}`)

  // Forward query params
  for (const [key, value] of Object.entries(req.query)) {
    if (key === "path") continue
    if (Array.isArray(value)) {
      value.forEach((v) => url.searchParams.append(key, v))
    } else if (value) {
      url.searchParams.set(key, value)
    }
  }

  const headers: Record<string, string> = {
    "X-API-Key": (req.headers["x-api-key"] as string) || process.env.YOUCOM_API_KEY || process.env.VITE_YOUCOM_API_KEY || "",
  }
  if (req.headers["content-type"]) {
    headers["Content-Type"] = req.headers["content-type"] as string
  }

  try {
    const response = await fetch(url.toString(), {
      method: req.method || "GET",
      headers,
      body: req.method !== "GET" && req.method !== "HEAD" ? JSON.stringify(req.body) : undefined,
    })

    // Forward status and headers
    res.status(response.status)
    const contentType = response.headers.get("content-type")
    if (contentType) res.setHeader("Content-Type", contentType)

    const data = await response.text()
    res.send(data)
  } catch (err) {
    res.status(502).json({ error: "Proxy error", message: (err as Error).message })
  }
}
