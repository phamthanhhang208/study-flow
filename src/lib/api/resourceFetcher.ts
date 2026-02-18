import { getYouComClient } from "./youcom";
import type { ArticleResource, VideoResource, SearchWebResult } from "./types";

// ── Video detection ──

interface DetectedVideo {
  platform: "youtube" | "vimeo";
  videoId: string;
}

const VIDEO_REGEXES: Array<{ platform: "youtube" | "vimeo"; pattern: RegExp }> = [
  {
    platform: "youtube",
    pattern: /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  },
  {
    platform: "vimeo",
    pattern: /(?:vimeo\.com\/)(\d+)/,
  },
  {
    platform: "vimeo",
    pattern: /(?:player\.vimeo\.com\/video\/)(\d+)/,
  },
];

function detectVideo(url: string): DetectedVideo | null {
  for (const { platform, pattern } of VIDEO_REGEXES) {
    const match = url.match(pattern);
    if (match) {
      return { platform, videoId: match[1] };
    }
  }
  return null;
}

function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
}

// ── oEmbed enrichment ──

interface OEmbedData {
  channelName?: string;
}

async function enrichVideoMetadata(
  url: string,
  videoId: string,
  platform: "youtube" | "vimeo",
): Promise<OEmbedData> {
  try {
    const oembedUrl =
      platform === "youtube"
        ? `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
        : `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`;

    const response = await fetch(oembedUrl, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) return {};

    const data = await response.json();
    return {
      channelName: data.author_name || undefined,
    };
  } catch {
    return {};
  }
}

// ── Domain extraction ──

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

// ── Resource building ──

function buildArticleResource(
  result: SearchWebResult,
  moduleId: string,
  index: number,
): ArticleResource {
  return {
    id: `${moduleId}-article-${index}`,
    url: result.url,
    title: result.title,
    description: result.description,
    snippet: result.snippets?.[0] || result.description,
    domain: extractDomain(result.url),
    favicon: result.favicon_url,
    publishedDate: result.page_age,
  };
}

async function buildVideoResource(
  result: SearchWebResult,
  video: DetectedVideo,
  moduleId: string,
  index: number,
): Promise<VideoResource> {
  const thumbnail =
    video.platform === "youtube"
      ? getYouTubeThumbnail(video.videoId)
      : "";

  const oembed = await enrichVideoMetadata(result.url, video.videoId, video.platform);

  return {
    id: `${moduleId}-video-${index}`,
    url: result.url,
    title: result.title,
    description: result.description,
    platform: video.platform,
    videoId: video.videoId,
    thumbnail,
    channelName: oembed.channelName,
    publishedDate: result.page_age,
  };
}

// ── Module resource fetching ──

export async function fetchModuleResources(
  searchQuery: string,
  moduleId: string,
  apiKey?: string,
): Promise<{ articles: ArticleResource[]; videos: VideoResource[] }> {
  const client = getYouComClient(apiKey);

  // Two parallel searches: general + video-focused
  const [generalResults, videoResults] = await Promise.all([
    client.search(searchQuery, { count: 10 }).catch(() => null),
    client.search(`${searchQuery} tutorial video youtube`, { count: 5 }).catch(() => null),
  ]);

  // Combine and deduplicate by URL
  const allResults: SearchWebResult[] = [];
  const seenUrls = new Set<string>();

  for (const result of [
    ...(generalResults?.results.web ?? []),
    ...(videoResults?.results.web ?? []),
  ]) {
    if (!seenUrls.has(result.url)) {
      seenUrls.add(result.url);
      allResults.push(result);
    }
  }

  // Separate videos from articles
  const videoEntries: Array<{ result: SearchWebResult; video: DetectedVideo }> = [];
  const articleEntries: SearchWebResult[] = [];

  for (const result of allResults) {
    const video = detectVideo(result.url);
    if (video) {
      videoEntries.push({ result, video });
    } else {
      articleEntries.push(result);
    }
  }

  // Build resources with limits
  const articles = articleEntries
    .slice(0, 4)
    .map((r, i) => buildArticleResource(r, moduleId, i));

  const videos = await Promise.all(
    videoEntries
      .slice(0, 3)
      .map(({ result, video }, i) => buildVideoResource(result, video, moduleId, i)),
  );

  return { articles, videos };
}

// ── Fetch all modules in parallel ──

export async function fetchAllModuleResources(
  modules: Array<{ id: string; searchQuery: string }>,
  apiKey?: string,
): Promise<Array<{ articles: ArticleResource[]; videos: VideoResource[] }>> {
  const results = await Promise.allSettled(
    modules.map((mod) => fetchModuleResources(mod.searchQuery, mod.id, apiKey)),
  );

  return results.map((result) => {
    if (result.status === "fulfilled") {
      return result.value;
    }
    console.warn("Failed to fetch resources for module:", result.reason);
    return { articles: [], videos: [] };
  });
}
