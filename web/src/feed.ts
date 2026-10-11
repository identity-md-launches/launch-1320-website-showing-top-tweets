export const topics = ['AI agents', 'Building', 'Protocol', 'Community'] as const;
export type Topic = typeof topics[number];
export type Sort = 'top' | 'newest' | 'discussed';
export interface Post {
  id: string;
  url: string;
  author: string;
  handle: string;
  avatar: string | null;
  publishedAt: string;
  likes: number;
  reposts: number;
  replies: number;
  views: number;
  topic: string;
  title: string;
  quote: string | null;
  summary: string;
  source: string;
}
export interface Filters { query: string; topic: string; sort: Sort; savedOnly: boolean; saved: string[] }

export function filterPosts(posts: Post[], filters: Filters): Post[] {
  const words = filters.query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return posts.filter(post => {
    const text = [post.author, `@${post.handle}`, post.title, post.summary, post.quote, post.topic, 'identity.md $IMD'].join(' ').toLocaleLowerCase();
    return (!filters.topic || post.topic === filters.topic) &&
      (!filters.savedOnly || filters.saved.includes(post.id)) && words.every(word => text.includes(word));
  }).sort((a, b) => {
    const byDate = new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    return filters.sort === 'newest' ? byDate : filters.sort === 'discussed' ? b.replies - a.replies || byDate : b.likes - a.likes || byDate;
  });
}

export function parseBookmarks(value: string | null, validIds: string[]): string[] {
  try {
    const parsed: unknown = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? [...new Set(parsed.filter((id): id is string => typeof id === 'string' && validIds.includes(id)))] : [];
  } catch { return []; }
}

export function compact(value: number): string {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

export function dateLabel(value: string): string {
  return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(value));
}
