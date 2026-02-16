import { QueryClient, useQuery } from "@tanstack/react-query"
import { getYouComClient } from "./api/youcom"
import type { SearchResponse, ContentResponse } from "./api/types"

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export function useSearch(query: string, enabled = true) {
  return useQuery<SearchResponse>({
    queryKey: ["search", query],
    queryFn: () => getYouComClient().search(query),
    enabled: enabled && query.length > 0,
  })
}

export function useContentFetch(urls: string[], enabled = true) {
  return useQuery<ContentResponse[]>({
    queryKey: ["content", urls],
    queryFn: () => getYouComClient().getContent(urls),
    enabled: enabled && urls.length > 0,
  })
}
