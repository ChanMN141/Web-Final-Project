'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Search, Briefcase, Send, CheckCircle, XCircle, Clock, Filter,
  DollarSign, User, Star, ShieldCheck, MapPin, Save, Wifi, Trash2,
} from 'lucide-react';
import {
  Button, Input, Textarea, Select, Label, Card, CardContent,
  Badge, Modal, EmptyState, Spinner, cn,
} from '@/components/ui';

// ─── Constants & Types ─────────────────────────────────────────────────────

const CATEGORIES = [
  'Web Development', 'Mobile Development', 'Design & Creative',
  'Writing & Content', 'Data & Analytics', 'Digital Marketing', 'Other',
] as const;

interface Skill { _id: string; name: string; category: string; }

interface Post {
  _id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  status: 'OPEN' | 'CLOSED';
  createdAt: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    verifiedAt?: string;
    averageRating?: number;
    reviewCount?: number;
  };
  requiredSkills?: Skill[];
  location?: { city?: string; country?: string; remote?: boolean };
}

interface MyApplication {
  _id: string;
  message: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  postId: {
    _id: string;
    title: string;
    category: string;
    budget: number;
    status: string;
    userId: { name: string; email: string };
  };
}

// ─── Schemas ───────────────────────────────────────────────────────────────

const applySchema = z.object({
  message: z.string().min(10, 'Message must be at least 10 characters').max(1000),
});
type ApplyFormValues = z.infer<typeof applySchema>;

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  bio: z.string().max(500).optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  country: z.string().max(100).optional().or(z.literal('')),
  remote: z.boolean().optional(),
});
type ProfileFormValues = z.infer<typeof profileSchema>;

// ─── Helper Components ─────────────────────────────────────────────────────

function AppStatusBadge({ status }: { status: 'PENDING' | 'ACCEPTED' | 'REJECTED' }) {
  const map = {
    PENDING:  { variant: 'warning' as const, icon: <Clock className="h-3 w-3" />,       label: 'Pending' },
    ACCEPTED: { variant: 'success' as const, icon: <CheckCircle className="h-3 w-3" />, label: 'Accepted' },
    REJECTED: { variant: 'danger'  as const, icon: <XCircle className="h-3 w-3" />,     label: 'Rejected' },
  };
  const { variant, icon, label } = map[status];
  return <Badge variant={variant} className="gap-1">{icon}{label}</Badge>;
}

function StatCard({ label, value, icon, color }: {
  label: string; value: number; icon: React.ReactNode; color: string;
}) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-500">{label}</p>
          <p className="mt-1 text-3xl font-bold text-zinc-900">{value}</p>
        </div>
        <div className={cn('rounded-xl p-3', color)}>{icon}</div>
      </div>
    </Card>
  );
}

// ─── Skills Selector ───────────────────────────────────────────────────────

function SkillsSelector({ skills, selected, onChange }: {
  skills: Skill[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const categories = [...new Set(skills.map(s => s.category))];
  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]);
  };
  return (
    <div className="max-h-52 overflow-y-auto rounded-md border border-zinc-200 p-3 space-y-3 bg-white">
      {categories.map(cat => (
        <div key={cat}>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-1.5">{cat}</p>
          <div className="flex flex-wrap gap-1.5">
            {skills.filter(s => s.category === cat).map(skill => (
              <button
                key={skill._id}
                type="button"
                onClick={() => toggle(skill._id)}
                className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                  selected.includes(skill._id)
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-zinc-700 border-zinc-200 hover:border-indigo-300'
                )}
              >
                {skill.name}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Apply Modal ───────────────────────────────────────────────────────────

function ApplyModal({ post, onClose, onSuccess }: {
  post: Post;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<ApplyFormValues>({
    resolver: zodResolver(applySchema),
  });

  const onSubmit = async (data: ApplyFormValues) => {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post._id, message: data.message }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to apply');
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Apply for this Post" maxWidth="md">
      <div className="space-y-4">
        <div className="rounded-lg bg-zinc-50 border border-zinc-100 p-4 space-y-1">
          <p className="font-semibold text-zinc-900">{post.title}</p>
          <div className="flex flex-wrap gap-2 text-xs text-zinc-500">
            <span className="font-medium text-indigo-600">${post.budget.toLocaleString()}</span>
            <span>·</span>
            <span>{post.category}</span>
            <span>·</span>
            <span>Posted by {post.userId.name}</span>
          </div>
          {post.requiredSkills && post.requiredSkills.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {post.requiredSkills.map(s => (
                <span key={s._id} className="text-[11px] rounded-full bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-indigo-700">
                  {s.name}
                </span>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md border border-red-100">{error}</div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="message">Cover Message</Label>
            <Textarea
              id="message"
              rows={5}
              placeholder="Tell the seeker why you're the right fit..."
              {...register('message')}
              disabled={submitting}
              className="min-h-32"
            />
            {errors.message && <p className="text-xs text-red-500">{errors.message.message}</p>}
          </div>
          <div className="flex gap-3">
            <Button type="submit" disabled={submitting} className="gap-2">
              {submitting ? <Spinner className="h-4 w-4 text-white" /> : <Send className="h-4 w-4" />}
              {submitting ? 'Submitting…' : 'Submit Application'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

// ─── Profile Tab ───────────────────────────────────────────────────────────

function ProfileTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [verifiedAt, setVerifiedAt] = useState<string | null>(null);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [reviewCount, setReviewCount] = useState<number>(0);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { remote: false },
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [profileRes, skillsRes] = await Promise.all([
          fetch('/api/auth/profile'),
          fetch('/api/skills'),
        ]);
        const [profileData, skillsData] = await Promise.all([profileRes.json(), skillsRes.json()]);

        if (skillsData.success) setAllSkills(skillsData.skills);

        if (profileData.success) {
          const u = profileData.user;
          setEmail(u.email);
          setVerifiedAt(u.verifiedAt ?? null);
          setAverageRating(u.averageRating ?? 0);
          setReviewCount(u.reviewCount ?? 0);
          setSelectedSkills((u.skills ?? []).map((s: Skill) => s._id));
          reset({
            name: u.name ?? '',
            bio: u.bio ?? '',
            city: u.location?.city ?? '',
            country: u.location?.country ?? '',
            remote: u.location?.remote ?? false,
          });
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [reset]);

  const onSave = async (data: ProfileFormValues) => {
    setSaving(true);
    setError('');
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          bio: data.bio || '',
          location: {
            city: data.city || '',
            country: data.country || '',
            remote: data.remote || false,
          },
          skills: selectedSkills,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to save');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-16"><Spinner className="text-indigo-600 h-8 w-8" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats strip */}
      {reviewCount > 0 && (
        <Card className="p-4">
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-1.5 text-amber-600 font-medium">
              <Star className="h-4 w-4 fill-current" />
              {averageRating.toFixed(1)} rating
              <span className="text-zinc-400 font-normal">({reviewCount} reviews)</span>
            </div>
            {verifiedAt && (
              <div className="flex items-center gap-1.5 text-indigo-600 font-medium">
                <ShieldCheck className="h-4 w-4" /> Verified Provider
              </div>
            )}
          </div>
        </Card>
      )}

      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-zinc-900 flex items-center gap-2 mb-5">
            <User className="h-5 w-5 text-indigo-600" /> My Profile
          </h2>
          <form onSubmit={handleSubmit(onSave)} className="space-y-5 max-w-lg">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={email} disabled className="bg-zinc-50 text-zinc-500" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prov-name">Display Name</Label>
              <Input id="prov-name" {...register('name')} disabled={saving} />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prov-bio">Bio</Label>
              <Textarea
                id="prov-bio"
                rows={3}
                placeholder="Describe your experience, expertise, and what makes you stand out..."
                {...register('bio')}
                disabled={saving}
                className="min-h-20"
              />
              {errors.bio && <p className="text-xs text-red-500">{errors.bio.message}</p>}
            </div>

            {/* Location */}
            <div>
              <Label className="flex items-center gap-1.5 mb-3">
                <MapPin className="h-4 w-4 text-zinc-400" /> Location
              </Label>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="prov-city">City</Label>
                  <Input id="prov-city" placeholder="e.g. London" {...register('city')} disabled={saving} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="prov-country">Country</Label>
                  <Input id="prov-country" placeholder="e.g. United Kingdom" {...register('country')} disabled={saving} />
                </div>
              </div>
              <label className="mt-3 flex items-center gap-2 cursor-pointer w-fit">
                <input
                  type="checkbox"
                  {...register('remote')}
                  disabled={saving}
                  className="h-4 w-4 rounded border-zinc-300 text-indigo-600"
                />
                <span className="text-sm text-zinc-700">Available for remote work</span>
              </label>
            </div>

            {/* Skills */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                Skills
                {selectedSkills.length > 0 && (
                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                    {selectedSkills.length} selected
                  </span>
                )}
              </Label>
              {allSkills.length > 0 ? (
                <SkillsSelector
                  skills={allSkills}
                  selected={selectedSkills}
                  onChange={setSelectedSkills}
                />
              ) : (
                <p className="text-xs text-zinc-400">Loading skills…</p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md border border-red-100">{error}</div>
            )}
            {saveSuccess && (
              <div className="bg-emerald-50 text-emerald-700 text-sm p-3 rounded-md border border-emerald-100 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" /> Profile saved!
              </div>
            )}
            <Button type="submit" disabled={saving} className="gap-2">
              {saving ? <Spinner className="h-4 w-4 text-white" /> : <Save className="h-4 w-4" />}
              {saving ? 'Saving…' : 'Save Profile'}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}

// ─── Job Board ─────────────────────────────────────────────────────────────

function JobBoard({ appliedPostIds, onApply, providerSkillIds }: {
  appliedPostIds: Set<string>;
  onApply: (post: Post) => void;
  providerSkillIds: string[];
}) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '8' });
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      if (remoteOnly) params.set('remote', 'true');
      const res = await fetch(`/api/posts?${params}`);
      const data = await res.json();
      if (data.success) {
        setPosts(data.posts);
        setTotal(data.pagination.total);
      }
    } finally {
      setLoading(false);
    }
  }, [search, category, remoteOnly, page]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);
  useEffect(() => { setPage(1); }, [search, category, remoteOnly]);

  const totalPages = Math.ceil(total / 8);

  const getMatchScore = (post: Post) => {
    if (!post.requiredSkills?.length || !providerSkillIds.length) return null;
    const matched = post.requiredSkills.filter(s => providerSkillIds.includes(s._id)).length;
    return Math.round((matched / post.requiredSkills.length) * 100);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search posts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="relative sm:w-52">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
          <Select value={category} onChange={e => setCategory(e.target.value)} className="pl-9">
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
        </div>
        <button
          onClick={() => setRemoteOnly(v => !v)}
          className={cn(
            'flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors shrink-0',
            remoteOnly
              ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
              : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300'
          )}
        >
          <Wifi className="h-4 w-4" /> Remote only
        </button>
      </div>

      {!loading && (
        <p className="text-sm text-zinc-500">
          {total} open {total === 1 ? 'post' : 'posts'}
          {providerSkillIds.length > 0 && ' — match scores based on your skills'}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Spinner className="text-indigo-600 h-8 w-8" /></div>
      ) : posts.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="h-12 w-12" />}
          title="No posts found"
          description="Try adjusting your search or filters."
        />
      ) : (
        <div className="space-y-3">
          {posts.map(post => {
            const alreadyApplied = appliedPostIds.has(post._id);
            const isExpanded = expandedId === post._id;
            const matchScore = getMatchScore(post);

            return (
              <Card key={post._id} className="overflow-hidden hover:border-indigo-200 transition-colors">
                <div className="p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-semibold text-zinc-900">{post.title}</h3>
                        <Badge variant="info">{post.category}</Badge>
                        {matchScore !== null && (
                          <Badge
                            variant={matchScore >= 70 ? 'success' : matchScore >= 40 ? 'warning' : 'secondary'}
                            className="gap-1"
                          >
                            <Star className="h-2.5 w-2.5" />
                            {matchScore}% match
                          </Badge>
                        )}
                        {post.location?.remote && (
                          <Badge variant="secondary" className="gap-1 text-[10px]">
                            <Wifi className="h-2.5 w-2.5" /> Remote
                          </Badge>
                        )}
                      </div>

                      <p className={cn('text-sm text-zinc-500', !isExpanded && 'line-clamp-2')}>
                        {post.description}
                      </p>

                      {/* Required skills */}
                      {post.requiredSkills && post.requiredSkills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {post.requiredSkills.map(s => (
                            <span
                              key={s._id}
                              className={cn(
                                'text-[11px] rounded-full border px-2 py-0.5',
                                providerSkillIds.includes(s._id)
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                  : 'bg-zinc-50 border-zinc-200 text-zinc-500'
                              )}
                            >
                              {s.name}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="mt-2 flex flex-wrap gap-4 text-xs text-zinc-500">
                        <span className="flex items-center gap-1 font-medium text-indigo-600">
                          <DollarSign className="h-3 w-3" />{post.budget.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {post.userId.name}
                          {post.userId.verifiedAt && (
                            <span title="Verified seeker">
                              <ShieldCheck className="h-3 w-3 text-indigo-500" />
                            </span>
                          )}
                          {post.userId.reviewCount !== undefined && post.userId.reviewCount > 0 && (
                            <span className="flex items-center gap-0.5 text-amber-500">
                              <Star className="h-3 w-3 fill-current" />
                              {post.userId.averageRating?.toFixed(1)}
                            </span>
                          )}
                        </span>
                        {post.location?.city && (
                          <span className="flex items-center gap-0.5">
                            <MapPin className="h-3 w-3" />
                            {post.location.city}{post.location.country && `, ${post.location.country}`}
                          </span>
                        )}
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {post.description.length > 120 && (
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : post._id)}
                          className="text-xs text-zinc-400 hover:text-zinc-600"
                        >
                          {isExpanded ? 'Less' : 'More'}
                        </button>
                      )}
                      {alreadyApplied ? (
                        <Badge variant="success" className="gap-1">
                          <CheckCircle className="h-3 w-3" /> Applied
                        </Badge>
                      ) : (
                        <Button size="sm" onClick={() => onApply(post)} className="gap-1.5">
                          <Send className="h-3.5 w-3.5" /> Apply
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-zinc-500">Page {page} of {totalPages}</span>
          <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── My Applications Tab ───────────────────────────────────────────────────

function MyApplications({ applications, loading, onWithdraw }: {
  applications: MyApplication[];
  loading: boolean;
  onWithdraw: (appId: string) => void;
}) {
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

  const handleWithdraw = async (appId: string) => {
    if (!confirm('Withdraw this application? This cannot be undone.')) return;
    setWithdrawingId(appId);
    try {
      const res = await fetch(`/api/applications/${appId}`, { method: 'DELETE' });
      if (res.ok) onWithdraw(appId);
    } finally {
      setWithdrawingId(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-16"><Spinner className="text-indigo-600 h-8 w-8" /></div>;
  }

  if (applications.length === 0) {
    return (
      <EmptyState
        icon={<Send className="h-12 w-12" />}
        title="No applications yet"
        description="Browse the job board and apply to posts that match your skills."
      />
    );
  }

  return (
    <div className="space-y-4">
      {applications.map(app => (
        <Card key={app._id}>
          <CardContent className="pt-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="font-semibold text-zinc-900">{app.postId.title}</h3>
                  {app.postId.status === 'CLOSED' && (
                    <Badge variant="secondary">Post Closed</Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-zinc-500 mb-3">
                  <span className="font-medium text-indigo-600">${app.postId.budget.toLocaleString()}</span>
                  <span>{app.postId.category}</span>
                  <span>by {app.postId.userId.name}</span>
                </div>
                <div className="bg-zinc-50 rounded-md border border-zinc-100 p-3">
                  <p className="text-xs text-zinc-400 mb-1 font-medium uppercase tracking-wide">Your message</p>
                  <p className="text-sm text-zinc-700">{app.message}</p>
                </div>
                <p className="mt-2 text-xs text-zinc-400">
                  Applied {new Date(app.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <AppStatusBadge status={app.status} />
                {app.status === 'PENDING' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleWithdraw(app._id)}
                    disabled={withdrawingId === app._id}
                    className="text-red-500 hover:bg-red-50 gap-1 text-xs"
                  >
                    <Trash2 className="h-3 w-3" />
                    {withdrawingId === app._id ? 'Withdrawing…' : 'Withdraw'}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

type Tab = 'board' | 'applications' | 'profile';

export default function ProviderDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('board');
  const [applications, setApplications] = useState<MyApplication[]>([]);
  const [appsLoading, setAppsLoading] = useState(true);
  const [applyingTo, setApplyingTo] = useState<Post | null>(null);
  const [providerSkillIds, setProviderSkillIds] = useState<string[]>([]);

  const fetchApplications = useCallback(async () => {
    setAppsLoading(true);
    try {
      const res = await fetch('/api/applications');
      const data = await res.json();
      if (data.success) setApplications(data.applications);
    } finally {
      setAppsLoading(false);
    }
  }, []);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  // Fetch provider's skills for match score calculation
  useEffect(() => {
    fetch('/api/auth/profile')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.user.skills) {
          setProviderSkillIds(d.user.skills.map((s: Skill) => s._id));
        }
      })
      .catch(() => {});
  }, []);

  const appliedPostIds = new Set(applications.map(a => a.postId._id));

  const total    = applications.length;
  const pending  = applications.filter(a => a.status === 'PENDING').length;
  const accepted = applications.filter(a => a.status === 'ACCEPTED').length;

  const handleWithdraw = (appId: string) => {
    setApplications(prev => prev.filter(a => a._id !== appId));
  };

  const TABS: { id: Tab; label: string }[] = [
    { id: 'board',        label: 'Browse Jobs' },
    { id: 'applications', label: 'My Applications' },
    { id: 'profile',      label: 'Profile' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Provider Dashboard</h1>
        <p className="text-zinc-500 text-sm mt-0.5">Find work, track applications, and manage your profile</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Applied"  value={total}    icon={<Send className="h-5 w-5 text-indigo-600" />}  color="bg-indigo-50" />
        <StatCard label="Pending"  value={pending}  icon={<Clock className="h-5 w-5 text-amber-600" />}  color="bg-amber-50" />
        <StatCard label="Accepted" value={accepted} icon={<CheckCircle className="h-5 w-5 text-emerald-600" />} color="bg-emerald-50" />
      </div>

      {/* Tabs */}
      <div>
        <div className="flex border-b border-zinc-200 mb-6">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                'px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                activeTab === id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-zinc-500 hover:text-zinc-700'
              )}
            >
              {label}
              {id === 'applications' && total > 0 && (
                <span className="ml-1.5 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
                  {total}
                </span>
              )}
            </button>
          ))}
        </div>

        {activeTab === 'board' && (
          <JobBoard
            appliedPostIds={appliedPostIds}
            onApply={setApplyingTo}
            providerSkillIds={providerSkillIds}
          />
        )}

        {activeTab === 'applications' && (
          <MyApplications
            applications={applications}
            loading={appsLoading}
            onWithdraw={handleWithdraw}
          />
        )}

        {activeTab === 'profile' && <ProfileTab />}
      </div>

      {/* Apply Modal */}
      {applyingTo && (
        <ApplyModal
          post={applyingTo}
          onClose={() => setApplyingTo(null)}
          onSuccess={fetchApplications}
        />
      )}
    </div>
  );
}
