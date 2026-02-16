import type { VideoMetadata, VideoProvider } from "../api/types"

interface VideoPattern {
  provider: VideoProvider
  patterns: RegExp[]
  embedUrl: (id: string) => string
  thumbnailUrl: (id: string) => string
}

const VIDEO_PATTERNS: VideoPattern[] = [
  {
    provider: "youtube",
    patterns: [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    ],
    embedUrl: (id) => `https://www.youtube.com/embed/${id}`,
    thumbnailUrl: (id) => `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
  },
  {
    provider: "vimeo",
    patterns: [
      /(?:vimeo\.com\/)(\d+)/,
      /(?:player\.vimeo\.com\/video\/)(\d+)/,
    ],
    embedUrl: (id) => `https://player.vimeo.com/video/${id}`,
    thumbnailUrl: () => "",
  },
]

export function detectVideo(url: string): VideoMetadata | null {
  for (const { provider, patterns, embedUrl, thumbnailUrl } of VIDEO_PATTERNS) {
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) {
        const videoId = match[1]
        const thumb = thumbnailUrl(videoId)
        return {
          provider,
          videoId,
          embedUrl: embedUrl(videoId),
          ...(thumb && { thumbnailUrl: thumb }),
        }
      }
    }
  }
  return null
}

export function isVideoUrl(url: string): boolean {
  return detectVideo(url) !== null
}

export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`
}

export async function fetchOEmbedMetadata(
  url: string,
): Promise<{ title?: string; thumbnail_url?: string; duration?: number } | null> {
  const video = detectVideo(url)
  if (!video) return null

  let oembedUrl: string
  if (video.provider === "youtube") {
    oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
  } else if (video.provider === "vimeo") {
    oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`
  } else {
    return null
  }

  try {
    const response = await fetch(oembedUrl)
    if (!response.ok) return null
    const data = await response.json()
    return {
      title: data.title,
      thumbnail_url: data.thumbnail_url,
      duration: data.duration,
    }
  } catch {
    return null
  }
}
