"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, BookOpen, Send, Users, ArrowLeft, Sparkles, ExternalLink } from 'lucide-react';

interface BookClubPost {
  id: string;
  clubId: string;
  userId: string | null;
  content: string;
  isAdeline: boolean;
  chapter: string | null;
  createdAt: string;
  user: { name: string; avatarUrl: string | null } | null;
}

interface BookClub {
  id: string;
  name: string;
  bookId: string;
  bookTitle: string;
  memberCount: number;
  postCount: number;
  isMember: boolean;
  lastPost: { content: string; createdAt: string; isAdeline: boolean } | null;
}

const COVER_COLORS = [
  { bg: '#4A3728', text: '#F5E6C8' },
  { bg: '#2F4731', text: '#E8F5E9' },
  { bg: '#6B2D3E', text: '#FCE4EC' },
  { bg: '#1A3A5C', text: '#E3F2FD' },
  { bg: '#5B4A1E', text: '#FFF8E1' },
];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function BookClubView() {
  const [clubs, setClubs] = useState<BookClub[]>([]);
  const [isLoadingClubs, setIsLoadingClubs] = useState(true);
  const [activeClub, setActiveClub] = useState<BookClub | null>(null);
  const [posts, setPosts] = useState<BookClubPost[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [isFacilitating, setIsFacilitating] = useState(false);

  // Create club form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newClubName, setNewClubName] = useState('');
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookId, setNewBookId] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const feedRef = useRef<HTMLDivElement>(null);

  // Load clubs on mount
  useEffect(() => {
    loadClubs();
  }, []);

  // Auto-scroll feed to bottom
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [posts]);

  async function loadClubs() {
    setIsLoadingClubs(true);
    try {
      const res = await fetch('/api/reading-nook/clubs');
      if (res.ok) setClubs(await res.json());
    } finally {
      setIsLoadingClubs(false);
    }
  }

  async function openClub(club: BookClub) {
    setActiveClub(club);
    setIsLoadingPosts(true);
    try {
      // Join automatically if not already a member
      if (!club.isMember) {
        await fetch('/api/reading-nook/clubs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'join', clubId: club.id }),
        });
        setClubs((prev) =>
          prev.map((c) => (c.id === club.id ? { ...c, isMember: true } : c))
        );
      }
      // Load posts
      const res = await fetch('/api/reading-nook/clubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'posts', clubId: club.id }),
      });
      if (res.ok) setPosts(await res.json());
    } finally {
      setIsLoadingPosts(false);
    }
  }

  async function submitPost(e: React.FormEvent) {
    e.preventDefault();
    if (!activeClub || !newPost.trim()) return;
    setIsPosting(true);
    try {
      const res = await fetch('/api/reading-nook/clubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'post', clubId: activeClub.id, content: newPost.trim() }),
      });
      if (res.ok) {
        const created = await res.json();
        setPosts((prev) => [...prev, created]);
        setNewPost('');
      }
    } finally {
      setIsPosting(false);
    }
  }

  async function askAdeline() {
    if (!activeClub) return;
    setIsFacilitating(true);
    try {
      const res = await fetch('/api/reading-nook/clubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'facilitate', clubId: activeClub.id, bookId: activeClub.bookId }),
      });
      if (res.ok) {
        const post = await res.json();
        setPosts((prev) => [...prev, post]);
      }
    } finally {
      setIsFacilitating(false);
    }
  }

  async function createClub(e: React.FormEvent) {
    e.preventDefault();
    if (!newClubName.trim() || !newBookTitle.trim()) return;
    setIsCreating(true);
    try {
      const slugifiedId = newBookId.trim() ||
        newBookTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const res = await fetch('/api/reading-nook/clubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          name: newClubName.trim(),
          bookTitle: newBookTitle.trim(),
          bookId: slugifiedId,
        }),
      });
      if (res.ok) {
        setNewClubName('');
        setNewBookTitle('');
        setNewBookId('');
        setShowCreateForm(false);
        await loadClubs();
      }
    } finally {
      setIsCreating(false);
    }
  }

  // ── CLUB FEED VIEW ─────────────────────────────────────────────────────────
  if (activeClub) {
    return (
      <div className="flex flex-col h-full">
        {/* Feed header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-amber-200 bg-amber-50/60">
          <div className="flex items-center gap-3">
            <button onClick={() => setActiveClub(null)} className="text-amber-600 hover:text-amber-800 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <p className="font-bold text-amber-900 leading-tight">{activeClub.name}</p>
              <p className="text-xs text-amber-600 italic">{activeClub.bookTitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`https://www.gutenberg.org/ebooks/${activeClub.bookId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-emerald-600 hover:text-emerald-800 flex items-center gap-1 font-medium"
            >
              <ExternalLink className="w-3 h-3" /> Read Free
            </a>
            <Button
              onClick={askAdeline}
              disabled={isFacilitating}
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1.5"
            >
              {isFacilitating ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Sparkles className="w-3 h-3" />
              )}
              Ask Adeline
            </Button>
          </div>
        </div>

        {/* Feed */}
        <div ref={feedRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FAF8F2]">
          {isLoadingPosts ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3 text-center">
              <Sparkles className="w-8 h-8 text-amber-300" />
              <p className="text-amber-700 font-medium">No discussion yet.</p>
              <p className="text-amber-500 text-sm">Click <strong>Ask Adeline</strong> to kick off the conversation!</p>
            </div>
          ) : (
            posts.map((post) => {
              const isAdeline = post.isAdeline;
              const isOwn = !isAdeline && post.user !== null;
              return (
                <div
                  key={post.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  {isAdeline && (
                    <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center mr-2 mt-1 shrink-0">
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                      isAdeline
                        ? 'bg-amber-100 border border-amber-300 text-amber-900 rounded-tl-sm'
                        : isOwn
                        ? 'bg-amber-700 text-white rounded-tr-sm'
                        : 'bg-white border border-amber-100 text-amber-900 rounded-tl-sm'
                    }`}
                  >
                    {isAdeline && (
                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1.5">
                        ✨ Adeline
                      </p>
                    )}
                    {!isAdeline && !isOwn && post.user && (
                      <p className="text-[10px] font-bold text-amber-500 mb-1">{post.user.name}</p>
                    )}
                    <p>{post.content}</p>
                    <p className={`text-[10px] mt-1.5 ${isOwn ? 'text-amber-200' : 'text-amber-400'}`}>
                      {timeAgo(post.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input */}
        <form onSubmit={submitPost} className="flex gap-2 p-3 border-t border-amber-200 bg-white">
          <Input
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="Share your thoughts on the book…"
            disabled={isPosting}
            className="flex-1 border-amber-200 focus:border-amber-500 text-sm"
          />
          <Button
            type="submit"
            disabled={isPosting || !newPost.trim()}
            className="bg-amber-700 hover:bg-amber-800"
          >
            {isPosting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
      </div>
    );
  }

  // ── CLUB LIST VIEW ─────────────────────────────────────────────────────────
  return (
    <div className="p-5 space-y-5 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-amber-900">Book Clubs</h2>
          <p className="text-sm text-amber-600 italic mt-0.5">
            Discuss great books with your homeschool community.
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm((v) => !v)}
          className="bg-amber-700 hover:bg-amber-800 text-white text-sm"
        >
          + New Club
        </Button>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <Card className="border-2 border-amber-300 bg-amber-50">
          <CardContent className="p-5">
            <h3 className="font-bold text-amber-900 mb-4">Start a New Book Club</h3>
            <form onSubmit={createClub} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-amber-700 uppercase tracking-wide block mb-1">
                  Club Name
                </label>
                <Input
                  value={newClubName}
                  onChange={(e) => setNewClubName(e.target.value)}
                  placeholder="e.g. Treasure Island Adventurers"
                  className="border-amber-200"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-amber-700 uppercase tracking-wide block mb-1">
                  Book Title
                </label>
                <Input
                  value={newBookTitle}
                  onChange={(e) => setNewBookTitle(e.target.value)}
                  placeholder="e.g. Treasure Island"
                  className="border-amber-200"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-amber-700 uppercase tracking-wide block mb-1">
                  Gutenberg ID <span className="font-normal text-amber-500">(optional — auto-generated if blank)</span>
                </label>
                <Input
                  value={newBookId}
                  onChange={(e) => setNewBookId(e.target.value)}
                  placeholder="e.g. 120  (from gutenberg.org/ebooks/120)"
                  className="border-amber-200"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <Button
                  type="submit"
                  disabled={isCreating || !newClubName.trim() || !newBookTitle.trim()}
                  className="bg-amber-700 hover:bg-amber-800 text-white"
                >
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Create Club
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                  className="border-amber-300 text-amber-700"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Club grid */}
      {isLoadingClubs ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
        </div>
      ) : clubs.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <BookOpen className="w-12 h-12 text-amber-200 mx-auto" />
          <p className="text-amber-700 font-medium">No active book clubs yet.</p>
          <p className="text-amber-500 text-sm">Be the first — start one above!</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {clubs.map((club, i) => {
            const color = COVER_COLORS[i % COVER_COLORS.length];
            return (
              <button
                key={club.id}
                onClick={() => openClub(club)}
                className="text-left rounded-2xl overflow-hidden shadow-md border border-amber-100 bg-white hover:shadow-xl transition-all group"
              >
                {/* Book spine header */}
                <div className="h-28 flex items-end p-4 relative" style={{ backgroundColor: color.bg }}>
                  <BookOpen className="absolute top-4 right-4 w-5 h-5 opacity-20" style={{ color: color.text }} />
                  <div>
                    <p className="font-bold text-base leading-tight line-clamp-2" style={{ color: color.text }}>
                      {club.bookTitle}
                    </p>
                    <p className="text-xs mt-1 opacity-70" style={{ color: color.text }}>{club.name}</p>
                  </div>
                </div>
                {/* Meta */}
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-amber-600">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {club.memberCount} {club.memberCount === 1 ? 'member' : 'members'}
                    </span>
                    <span>{club.postCount} posts</span>
                    {club.isMember && (
                      <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">
                        Joined
                      </span>
                    )}
                  </div>
                  {club.lastPost && (
                    <p className="text-xs text-amber-500 italic line-clamp-2">
                      {club.lastPost.isAdeline ? '✨ Adeline: ' : ''}
                      {club.lastPost.content}
                    </p>
                  )}
                  <div className="pt-1">
                    <span className="text-xs font-bold text-amber-700 group-hover:text-amber-900 uppercase tracking-wide transition-colors">
                      {club.isMember ? 'Enter Discussion →' : 'Join & Read →'}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
