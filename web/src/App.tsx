import { useEffect, useRef, useState } from 'react';
import {
  ArrowDown, ArrowRight, ArrowUpRight, Bookmark, Check, ChevronDown, Code2,
  Compass, Cpu, Eye, Flame, Hash, Heart, Info, Leaf, Link2, MessageCircle,
  Radar, Repeat2, Search, Sparkles, Sprout, Users, X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import data from './posts.json';
import { compact, dateLabel, filterPosts, parseBookmarks, topics } from './feed';
import type { Post, Sort } from './feed';

const posts: Post[] = data.posts;
const ids = posts.map(post => post.id);
const bookmarkKey = 'identity-pond:bookmarks:v1';
const topicIcons: Record<string, LucideIcon> = { 'AI agents': Cpu, Building: Code2, Protocol: Radar, Community: Users };
const descriptions: Record<string, string> = {
  'AI agents': 'The little workers with big ambitions.',
  Building: 'Ideas becoming something you can use.',
  Protocol: 'Under the hood of identity.md.',
  Community: 'Thoughts from around the pond.',
};
type Page = 'feed' | 'topics' | 'saved';

function Avatar({ post, small = false }: { post: Post; small?: boolean }) {
  return <span className={`avatar ${small ? 'avatar-small' : ''} avatar-${post.handle}`}>
    {post.avatar ? <img src={post.avatar} alt="" width="44" height="44" /> : <Leaf aria-hidden="true" />}
  </span>;
}

function ExternalLink({ href, children, className, label }: { href: string; children: React.ReactNode; className?: string; label?: string }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" className={className} aria-label={label}>{children}<span className="sr-only"> (opens in a new tab)</span></a>;
}

function PostCard({ post, rank, saved, onSave, onCopy, onTopic, copied, featured }: {
  post: Post; rank: number; saved: boolean; onSave: (post: Post) => void;
  onCopy: (post: Post) => void; onTopic: (topic: string) => void; copied: boolean; featured: boolean;
}) {
  const TopicIcon = topicIcons[post.topic];
  return <article className={`post-card ${featured ? 'post-featured' : ''}`} id={`post-${post.id}`} aria-labelledby={`title-${post.id}`}>
    {featured && <div className="pick-ribbon"><Flame size={15} aria-hidden="true" /><span>Top of the pond</span><span className="pick-note">Most liked in this collection</span></div>}
    <div className="post-inner">
      <div className="post-top">
        <ExternalLink href={`https://x.com/${post.handle}`} className="author-link" label={`${post.author} on X`}>
          <Avatar post={post} /><span className="author-details"><strong>{post.author}</strong><span>@{post.handle}</span></span>
        </ExternalLink>
        <time dateTime={new Date(post.publishedAt).toISOString()} title={new Date(post.publishedAt).toUTCString()}>{dateLabel(post.publishedAt)}</time>
        <span className="x-mark" aria-hidden="true">𝕏</span>
      </div>
      <div className="post-copy">
        <h3 id={`title-${post.id}`}>{post.title}</h3>
        {post.quote && <blockquote>“{post.quote}”</blockquote>}
        <p className="post-summary"><span className="summary-label">Our take</span>{post.summary}</p>
      </div>
      <div className="post-tags"><button className="topic-tag" onClick={() => onTopic(post.topic)} aria-label={`Filter by ${post.topic}`}><TopicIcon size={13} aria-hidden="true" />{post.topic}</button><span className="post-rank">#{rank} in collection</span></div>
      <div className="post-footer">
        <div className="metrics" role="group" aria-label="Engagement at capture">
          <span title={`${post.replies} replies`}><MessageCircle aria-hidden="true" /><span>{compact(post.replies)}<span className="sr-only"> replies</span></span></span>
          <span title={`${post.reposts} reposts`}><Repeat2 aria-hidden="true" /><span>{compact(post.reposts)}<span className="sr-only"> reposts</span></span></span>
          <span title={`${post.likes} likes`}><Heart aria-hidden="true" /><span>{compact(post.likes)}<span className="sr-only"> likes</span></span></span>
          <span className="view-metric" title={`${post.views} views`}><Eye aria-hidden="true" /><span>{compact(post.views)}<span className="sr-only"> views</span></span></span>
        </div>
        <div className="post-actions">
          <button className={`icon-button ${copied ? 'is-saved' : ''}`} title="Copy original post link" aria-label={`Copy link to ${post.title}`} onClick={() => onCopy(post)}>{copied ? <Check /> : <Link2 />}</button>
          <button className={`icon-button ${saved ? 'is-saved' : ''}`} title={saved ? 'Remove saved post' : 'Save post'} aria-pressed={saved} aria-label={`${saved ? 'Unsave' : 'Save'} ${post.title}`} onClick={() => onSave(post)}><Bookmark fill={saved ? 'currentColor' : 'none'} /></button>
          <ExternalLink href={post.url} className="read-post" label={`Read ${post.title} on X`}>Read on X<ArrowUpRight size={15} aria-hidden="true" /></ExternalLink>
        </div>
      </div>
    </div>
  </article>;
}

export function App() {
  const initialPage = (): Page => window.location.hash === '#saved' ? 'saved' : window.location.hash === '#topics' ? 'topics' : 'feed';
  const [page, setPage] = useState<Page>(initialPage);
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState('');
  const [sort, setSort] = useState<Sort>('top');
  const [limit, setLimit] = useState(5);
  const [saved, setSaved] = useState<string[]>(() => {
    try { return parseBookmarks(localStorage.getItem(bookmarkKey), ids); } catch { return []; }
  });
  const [storageProblem, setStorageProblem] = useState(false);
  const [notice, setNotice] = useState('');
  const [copied, setCopied] = useState('');
  const [copyFallback, setCopyFallback] = useState('');
  const [about, setAbout] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const feedRef = useRef<HTMLElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    function onHash() { setPage(initialPage()); setQuery(''); setTopic(''); setLimit(5); }
    function syncSaved(event: StorageEvent) {
      if (event.key === bookmarkKey || event.key === null) setSaved(parseBookmarks(event.newValue, ids));
    }
    window.addEventListener('hashchange', onHash);
    window.addEventListener('storage', syncSaved);
    return () => { window.removeEventListener('hashchange', onHash); window.removeEventListener('storage', syncSaved); clearTimeout(noticeTimer.current); };
  }, []);

  useEffect(() => {
    if (about) { lastFocus.current = document.activeElement as HTMLElement; dialogRef.current?.showModal(); }
    else if (dialogRef.current?.open) { dialogRef.current.close(); lastFocus.current?.focus(); }
  }, [about]);

  const filtered = filterPosts(posts, { query, topic, sort, savedOnly: page === 'saved', saved });
  const rankOrder = filterPosts(posts, { query: '', topic: '', sort: 'top', savedOnly: false, saved: [] });
  const authors = [...new Map(posts.map(post => [post.handle, post])).values()];

  function announce(message: string) {
    clearTimeout(noticeTimer.current); setNotice(message);
    noticeTimer.current = setTimeout(() => { setNotice(''); setCopied(''); }, 4000);
  }
  function navigate(next: Page) {
    setPage(next); setQuery(''); setTopic(''); setLimit(5);
  }
  function chooseTopic(next: string) {
    setPage('feed'); setTopic(next); setQuery(''); setLimit(5);
    // Replace the current collection route without resetting the chosen filter.
    history.replaceState(null, '', '#feed');
    requestAnimationFrame(() => { feedRef.current?.scrollIntoView({ block: 'start' }); feedRef.current?.focus({ preventScroll: true }); });
  }
  function save(post: Post) {
    const wasSaved = saved.includes(post.id);
    const next = wasSaved ? saved.filter(id => id !== post.id) : [...saved, post.id];
    setSaved(next);
    try { localStorage.setItem(bookmarkKey, JSON.stringify(next)); setStorageProblem(false); }
    catch { setStorageProblem(true); }
    announce(wasSaved ? 'Post removed from saved.' : 'Post saved. Find it in Bookmarks.');
  }
  async function copy(post: Post) {
    try {
      if (!navigator.clipboard) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(post.url);
      setCopied(post.id); announce('Original X link copied.');
    } catch { setCopyFallback(post.url); }
  }
  function resetFilters() { setQuery(''); setTopic(''); setLimit(5); searchRef.current?.focus(); }
  function jumpToFeed() {
    feedRef.current?.scrollIntoView({ block: 'start' }); searchRef.current?.focus({ preventScroll: true });
  }

  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <div className="app-shell">
      <aside className="sidebar">
        <a href="#feed" className="brand" onClick={() => navigate('feed')} aria-label="The Pond home"><img src="./art/favicon.svg" alt="" width="40" height="40" /><span>the pond<span className="brand-dot">.</span><small>an identity.md outpost</small></span></a>
        <nav aria-label="Main navigation" className="main-nav">
          <a href="#feed" className={page === 'feed' ? 'nav-item selected' : 'nav-item'} aria-current={page === 'feed' ? 'page' : undefined} onClick={() => navigate('feed')}><Flame /><span>The feed</span><span className="nav-count">{posts.length}</span></a>
          <a href="#topics" className={page === 'topics' ? 'nav-item selected' : 'nav-item'} aria-current={page === 'topics' ? 'page' : undefined} onClick={() => navigate('topics')}><Compass /><span>Explore topics</span></a>
          <a href="#saved" className={page === 'saved' ? 'nav-item selected' : 'nav-item'} aria-current={page === 'saved' ? 'page' : undefined} onClick={() => navigate('saved')}><Bookmark /><span>Bookmarks</span>{saved.length > 0 && <span className="nav-count">{saved.length}</span>}</a>
        </nav>
        <div className="sidebar-topics"><p className="section-label">Around the pond</p>{topics.map(item => {
          const Icon = topicIcons[item]; return <button key={item} onClick={() => chooseTopic(item)}><Icon size={17} /><span>{item}</span><ArrowUpRight size={13} /></button>;
        })}</div>
        <div className="sidebar-bottom">
          <div className="community-note"><span className="mini-frog"><img src="./art/favicon.svg" alt="" width="30" height="30" /></span><strong>Built for curious frens.</strong><p>A little less noise.<br />A little more signal.</p><ExternalLink href="https://imd.fun" className="quiet-link">Discover identity.md<ArrowUpRight size={14} /></ExternalLink></div>
          <button className="about-button" onClick={() => setAbout(true)}><Info size={17} />About this collection</button>
          <p className="sidebar-credit">Independent. Community-minded.</p>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar"><div className="breadcrumb"><span>identity.md</span><span className="breadcrumb-slash">/</span><span>The conversation</span></div><div className="topbar-right"><span className="edition"><span className="status-dot" />Curated, not automated</span><ExternalLink className="x-link" href="https://x.com/search?q=%22identity.md%22%20OR%20%22imd.fun%22&src=typed_query" label="Search identity.md on X">𝕏<ArrowUpRight size={14} /></ExternalLink></div></header>
        <main id="main" tabIndex={-1}>
          {page === 'feed' && <section className="hero" aria-labelledby="hero-title">
            <div className="hero-content"><span className="hero-pill"><Sparkles size={14} />Pepes, armed with AI.</span><h1 id="hero-title">Good signal.<br /><span>Great frens.</span></h1><p>The top tweets, ideas, and builders<br className="desktop-break" /> around identity.md. All in one pond.</p><button className="primary-button" onClick={jumpToFeed}>Explore the feed<ArrowDown size={16} /></button></div>
            <img className="hero-art" src="./art/pepe-squad.svg" alt="Three Pepe-inspired frogs equipped with AI chips, headsets, and handheld computers." width="520" height="310" />
          </section>}
          {page === 'topics' && <section className="page-intro"><span className="hero-pill"><Compass size={14} />Find your corner</span><h1>Follow your curiosity.</h1><p>Explore the ideas taking shape around identity.md.</p></section>}
          {page === 'saved' && <section className="page-intro"><span className="hero-pill"><Bookmark size={14} />Your collection</span><h1>Worth another read.</h1><p>Posts you’ve saved, kept in this browser.</p></section>}

          <div className="content-grid">
            <section className="feed-column" ref={feedRef} tabIndex={-1} aria-labelledby="feed-title">
              {page === 'topics' ? <>
                <div className="feed-heading"><h2 id="feed-title">Explore topics</h2><span>{topics.length} rabbit holes</span></div>
                <div className="topic-grid">{topics.map(item => {
                  const Icon = topicIcons[item]; return <button className="topic-card" key={item} onClick={() => chooseTopic(item)}><span className="topic-card-icon"><Icon size={26} /></span><h3>{item}</h3><p>{descriptions[item]}</p><span className="topic-card-footer">{posts.filter(p => p.topic === item).length} posts<ArrowRight size={18} /></span></button>;
                })}</div>
                <div className="topics-footnote"><Sprout /><p>Small collection. Interesting ideas.<br /><span>Every post is picked for its connection to identity.md.</span></p></div>
              </> : <>
                <div className="feed-heading"><h2 id="feed-title">{page === 'saved' ? 'Bookmarks' : 'From around the pond'}</h2><button className="method-button" onClick={() => setAbout(true)}><Info size={14} /><span>About the feed</span></button></div>
                <div className="filter-bar">
                  <div className="feed-tabs" role="group" aria-label="Sort posts">{([['top', 'Top tweets', Flame], ['newest', 'Latest', Sparkles], ['discussed', 'Discussion', MessageCircle]] as const).map(([value, label, Icon]) => <button key={value} aria-pressed={sort === value} className={sort === value ? 'feed-tab active' : 'feed-tab'} onClick={() => { setSort(value); setLimit(5); }}><Icon size={16} /><span>{label}</span></button>)}</div>
                  <span className="collection-range">Aug – Oct 2026</span>
                </div>
                <div className="search-row"><label className="search-box"><Search size={18} /><span className="sr-only">Search posts</span><input ref={searchRef} type="search" name="search" autoComplete="off" placeholder="Search posts, people, or ideas…" value={query} onChange={event => { setQuery(event.target.value); setLimit(5); }} />{query && <button className="clear-search" onClick={() => { setQuery(''); searchRef.current?.focus(); }} aria-label="Clear search"><X size={16} /></button>}</label></div>
                <div className="topic-filters" role="group" aria-label="Filter posts by topic"><button aria-pressed={!topic} className={!topic ? 'filter-chip active' : 'filter-chip'} onClick={() => { setTopic(''); setLimit(5); }}>All posts</button>{topics.map(item => <button key={item} className={topic === item ? 'filter-chip active' : 'filter-chip'} aria-pressed={topic === item} onClick={() => { setTopic(item); setLimit(5); }}>{item}</button>)}</div>
                <div className="collection-caption"><p role="status">{filtered.length} {filtered.length === 1 ? 'post' : 'posts'}{topic ? ` · ${topic}` : ''}{query ? ` matching “${query}”` : ''}</p><span>Snapshot · {dateLabel(data.capturedAt)} 2026</span></div>
                {storageProblem && <div className="inline-notice" role="status"><Info size={18} /><p>Browser storage is unavailable. Your bookmarks will last until you leave this page.</p></div>}
                <div className="post-list">{filtered.slice(0, limit).map(post => <PostCard key={post.id} post={post} rank={rankOrder.findIndex(p => p.id === post.id) + 1} saved={saved.includes(post.id)} onSave={save} onCopy={copy} onTopic={chooseTopic} copied={copied === post.id} featured={page === 'feed' && sort === 'top' && !query && !topic && post.id === rankOrder[0].id} />)}</div>
                {filtered.length === 0 && <div className="empty-state"><span className="empty-icon">{page === 'saved' && saved.length === 0 ? <Bookmark size={28} /> : <Search size={28} />}</span><h3>{page === 'saved' && saved.length === 0 ? 'A good find deserves a bookmark.' : 'No ripples here yet.'}</h3><p>{page === 'saved' && saved.length === 0 ? 'Save a post from the feed to keep it close. Your collection will appear here.' : `No posts ${query ? `match “${query}”` : 'match this topic'}${topic && query ? ` in ${topic}` : ''}. Try another search or clear your filters.`}</p>{page === 'saved' && saved.length === 0 ? <a className="secondary-button" href="#feed" onClick={() => navigate('feed')}>Explore the feed<ArrowRight size={16} /></a> : <button className="secondary-button" onClick={resetFilters}>Clear filters<X size={16} /></button>}</div>}
                {filtered.length > limit && <button className="load-more" onClick={() => setLimit(value => value + 5)}>Show {Math.min(5, filtered.length - limit)} more posts<ArrowDown size={16} /></button>}
                {filtered.length > 0 && filtered.length <= limit && <div className="end-note"><Leaf size={17} /><span>You’re all caught up with this collection.</span></div>}
                <p className="feed-disclaimer">A handpicked collection, not a live feed. Summaries are ours; words in quotes are the author’s. Counts reflect the snapshot.</p>
              </>}
            </section>

            <aside className="right-rail" aria-label="More from the pond">
              <section className="collection-card"><div className="rail-heading"><h2>The pond, at a glance</h2><Radar size={18} /></div><p>A small collection.<br />A bigger conversation.</p><div className="collection-stats"><span><strong>{posts.length}</strong>selected posts</span><span><strong>{authors.length}</strong>community voices</span></div><div className="snapshot-date"><span className="status-dot" />Collected {dateLabel(data.capturedAt)} 2026</div></section>
              <section className="rail-section"><div className="rail-heading"><h2>Explore the conversation</h2><Hash size={17} /></div><div className="rail-topics">{topics.map((item, index) => <button key={item} onClick={() => chooseTopic(item)}><span className="topic-number">0{index + 1}</span><span><strong>{item}</strong><small>{posts.filter(post => post.topic === item).length} posts in this collection</small></span><ArrowUpRight size={16} /></button>)}</div></section>
              <section className="rail-section"><div className="rail-heading"><h2>Frens to know</h2><Users size={17} /></div><p className="rail-description">The voices in this collection.</p><div className="authors">{authors.map(post => <ExternalLink href={`https://x.com/${post.handle}`} className="author-row" key={post.handle} label={`${post.author} on X`}><Avatar post={post} small /><span><strong>{post.author}</strong><small>@{post.handle}</small></span><ArrowUpRight size={15} /></ExternalLink>)}</div></section>
              <section className="pepe-note"><span className="note-sparkle">✳</span><h2>Small frogs.<br />Big ideas.</h2><p>Intelligence is better<br />when it’s shared.</p><img src="./art/favicon.svg" alt="" width="64" height="64" /><span className="pepe-note-bottom">See you around the pond.</span></section>
              <footer className="rail-footer"><button onClick={() => setAbout(true)}>About & sources</button><span>·</span><ExternalLink href="https://imd.fun">identity.md<ArrowUpRight size={12} /></ExternalLink><p>Made for the community, by the community.</p></footer>
            </aside>
          </div>
        </main>
      </div>
    </div>
    <div className={`toast ${notice ? 'visible' : ''}`} role="status">{notice && <><Check size={16} /><span>{notice}</span></>}</div>
    {copyFallback && <div className="copy-fallback" role="region" aria-label="Copy post link"><label htmlFor="copy-link">Copy this original post link</label><div><input id="copy-link" value={copyFallback} readOnly onFocus={event => event.currentTarget.select()} autoFocus /><button className="icon-button" onClick={() => setCopyFallback('')} aria-label="Dismiss copy link"><X /></button></div><p>Automatic copying isn’t available in this browser. Select and copy the link.</p></div>}
    <dialog ref={dialogRef} className="about-dialog" onCancel={() => setAbout(false)} onClose={() => setAbout(false)} aria-labelledby="about-title">
      <div className="dialog-top"><span className="dialog-brand"><img src="./art/favicon.svg" alt="" width="32" height="32" />The Pond</span><button className="icon-button" onClick={() => setAbout(false)} aria-label="Close about collection" autoFocus><X /></button></div>
      <h2 id="about-title">A little context. A better feed.</h2><p>The Pond is an independent reading room for the identity.md community. This edition contains eight public posts from three authors, published between 10 August and 2 October 2026.</p>
      <h3>What makes a top tweet?</h3><p>We selected posts about IMD’s agents, community, protocol, and tools. <strong>Top tweets</strong> sorts this collection by likes, <strong>Latest</strong> by publication date, and <strong>Discussion</strong> by reply count. This is not an exhaustive or live ranking of X.</p>
      <h3>Where the numbers come from</h3><p>Public post metadata was retrieved through FxTwitter on <time dateTime={data.capturedAt}>11 October 2026, 17:03 UTC</time>. Counts are a fixed snapshot and may differ from X. We use short excerpts and clearly labeled editorial summaries. Open the original post for full context.</p>
      <h3>Your bookmarks stay with you</h3><p>Saved posts live in this browser’s local storage. No account, tracking, or wallet connection. Clearing site data removes bookmarks.</p>
      <details><summary>View the collection’s sources<ChevronDown size={16} /></summary><ul>{posts.map(post => <li key={post.id}><ExternalLink href={post.url}>{post.title}<ArrowUpRight size={13} /></ExternalLink><ExternalLink className="metadata-source" href={post.source}>Metadata<ArrowUpRight size={12} /></ExternalLink></li>)}</ul></details>
      <p className="dialog-footnote">Community analysis reflects each author’s views at the time of publication. The Pond is not affiliated with X or an official identity.md channel.</p>
    </dialog>
  </>;
}
