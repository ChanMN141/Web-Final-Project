'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Plus, Briefcase, Users, Clock, CheckCircle, Trash2,
  ChevronDown, ChevronUp, FileText, ToggleLeft, ToggleRight,
  Star, User, Save, X, MapPin, Edit2,
} from 'lucide-react';
import {
  Button, Input, Textarea, Select, Label, Card, CardHeader,
  CardTitle, CardContent, Badge, Modal, EmptyState, Spinner, cn,
} from '@/components/ui';

// ─── Constants & Types ─────────────────────────────────────────────────────

const CATEGORIES = [
  'Web Development', 'Mobile Development', 'Design & Creative',
  'Writing & Content', 'Data & Analytics', 'Digital Marketing', 'Other',
] as const;

interface Skill { _id: string; name: string; category: string; }
interface MilestoneInput { title: string; amount: string; dueDate: string; }

interface Post {
  _id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  status: 'OPEN' | 'CLOSED';
  applicationCount: number;
  pendingCount: number;
  createdAt: string;
  requiredSkills?: Skill[];
  location?: { city?: string; country?: string; remote?: boolean };
}

interface Application {
  _id: string;
  message: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  hasReview?: boolean;
  providerId: {
    _id: string;
    name: string;
    email: string;
    bio?: string;
    averageRating?: number;
    reviewCount?: number;
    verifiedAt?: string;
  };
}

interface ProviderProfile {
  _id: string;
  name: string;
  bio?: string;
  location?: { city?: string; country?: string; remote?: boolean };
  skills: Skill[];
  averageRating: number;
  reviewCount: number;
  verifiedAt?: string;
  createdAt: string;
}

interface Review {
  _id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  seekerId: { name: string };
}

// ─── Schemas ───────────────────────────────────────────────────────────────

const postSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100),
  description: z.string().min(20, 'Description must be at least 20 characters').max(2000),
  category: z.enum(CATEGORIES as unknown as [string, ...string[]]),
  budget: z.coerce.number().min(0, 'Budget must be a positive number'),
  city: z.string().max(100).optional().or(z.literal('')),
  country: z.string().max(100).optional().or(z.literal('')),
  remote: z.boolean().optional(),
});
type PostFormValues = z.infer<typeof postSchema>;

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  bio: z.string().max(500).optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  country: z.string().max(100).optional().or(z.literal('')),
});
type ProfileFormValues = z.infer<typeof profileSchema>;

// ─── Small Helpers ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: 'PENDING' | 'ACCEPTED' | 'REJECTED' }) {
  const map = {
    PENDING:  { variant: 'warning' as const, label: 'Pending' },
    ACCEPTED: { variant: 'success' as const, label: 'Accepted' },
    REJECTED: { variant: 'danger'  as const, label: 'Rejected' },
  };
  const { variant, label } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}

function PostStatusBadge({ status }: { status: 'OPEN' | 'CLOSED' }) {
  return (
    <Badge variant={status === 'OPEN' ? 'info' : 'secondary'}>
      {status === 'OPEN' ? 'Open' : 'Closed'}
    </Badge>
  );
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
    <div className="max-h-44 overflow-y-auto rounded-md border border-zinc-200 p-3 space-y-3 bg-white">
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

// ─── Review Modal ──────────────────────────────────────────────────────────

function ReviewModal({ applicationId, providerName, onClose, onSuccess }: {
  applicationId: string;
  providerName: string;
  onClose: () => void;
  onSuccess: (appId: string) => void;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, rating, comment }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to submit review');
      onSuccess(applicationId);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={`Review ${providerName}`} maxWidth="md">
      <div className="space-y-5">
        <div>
          <Label className="mb-2 block">Rating</Label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={cn(
                  'text-3xl transition-colors leading-none',
                  star <= rating ? 'text-amber-400' : 'text-zinc-200'
                )}
              >
                ★
              </button>
            ))}
            <span className="ml-2 self-center text-sm text-zinc-500">
              {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][rating]}
            </span>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="review-comment">Comment <span className="text-zinc-400">(optional)</span></Label>
          <Textarea
            id="review-comment"
            rows={4}
            placeholder="Share your experience working with this provider..."
            value={comment}
            onChange={e => setComment(e.target.value)}
            disabled={submitting}
            className="min-h-24"
          />
        </div>
        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md border border-red-100">{error}</div>
        )}
        <div className="flex gap-3">
          <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
            {submitting ? <Spinner className="h-4 w-4 text-white" /> : <Star className="h-4 w-4" />}
            {submitting ? 'Submitting…' : 'Submit Review'}
          </Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Provider Profile Modal ──────────────────────────────────────────────────

function ProviderProfileModal({ providerId, onClose }: { providerId: string; onClose: () => void }) {
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [profileRes, reviewsRes] = await Promise.all([
          fetch(`/api/users/${providerId}`),
          fetch(`/api/reviews?providerId=${providerId}`),
        ]);
        
        const profileData = await profileRes.json();
        const reviewsData = await reviewsRes.json();

        if (profileData.success) setProfile(profileData.user);
        if (reviewsData.success) setReviews(reviewsData.reviews);
      } catch (err) {
        console.error('Failed to fetch provider details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [providerId]);

  return (
    <Modal isOpen onClose={onClose} title={profile ? `${profile.name}'s Profile` : 'Provider Profile'} maxWidth="xl">
      {loading ? (
        <div className="flex justify-center py-12"><Spinner className="text-indigo-600 h-8 w-8" /></div>
      ) : profile ? (
        <div className="space-y-8">
          {/* Header Info */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h2 className="text-xl font-bold text-zinc-900">{profile.name}</h2>
                {profile.verifiedAt && <Badge variant="info" className="text-xs">Verified Provider</Badge>}
              </div>
              
              {profile.location && (profile.location.city || profile.location.country) && (
                <p className="flex items-center gap-1.5 text-sm text-zinc-500 mb-2">
                  <MapPin className="h-4 w-4" /> 
                  {[profile.location.city, profile.location.country].filter(Boolean).join(', ')}
                  {profile.location.remote && ' (Open to Remote)'}
                </p>
              )}

              {profile.reviewCount > 0 && (
                <div className="flex items-center gap-1 text-amber-600 bg-amber-50 w-fit px-2.5 py-1 rounded-md mb-4">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="font-semibold">{profile.averageRating.toFixed(1)}</span>
                  <span className="text-amber-700/60 text-sm ml-1">({profile.reviewCount} reviews)</span>
                </div>
              )}
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 mb-2">About</h3>
              <p className="text-sm text-zinc-600 leading-relaxed bg-zinc-50 p-4 rounded-lg border border-zinc-100">
                {profile.bio}
              </p>
            </div>
          )}

          {/* Skills */}
          {profile.skills && profile.skills.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 mb-3">Skills & Expertise</h3>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map(skill => (
                  <Badge key={skill._id} variant="secondary" className="bg-white border-zinc-200 text-zinc-700">
                    {skill.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Reviews List */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 mb-4 flex items-center gap-2">
              Reviews <Badge variant="default" className="rounded-full px-2 py-0.5">{reviews.length}</Badge>
            </h3>
            
            {reviews.length === 0 ? (
              <p className="text-sm text-zinc-500 italic">No reviews yet.</p>
            ) : (
              <div className="space-y-3">
                {reviews.map(review => (
                  <div key={review._id} className="p-4 rounded-lg border border-zinc-100 bg-white">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-1 text-amber-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={cn("h-3.5 w-3.5", i < review.rating ? "fill-current" : "text-zinc-200")} />
                        ))}
                      </div>
                      <span className="text-xs text-zinc-400">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-zinc-700 mt-2">{review.comment}</p>
                    )}
                    <p className="text-xs text-zinc-500 mt-3 font-medium">— {review.seekerId?.name || 'A Seeker'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <EmptyState title="Profile not found" description="This provider's profile could not be loaded." icon={<User className="h-8 w-8" />} />
      )}
    </Modal>
  );
}

// ─── Applications Panel ────────────────────────────────────────────────────

function ApplicationsPanel({ postId, postTitle, onClose, onPostClosed }: {
  postId: string; postTitle: string; onClose: () => void; onPostClosed?: () => void;
}) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [reviewingApp, setReviewingApp] = useState<Application | null>(null);
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/posts/${postId}/applications`);
      const data = await res.json();
      if (data.success) setApplications(data.applications);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  const handleUpdateStatus = async (appId: string, status: 'ACCEPTED' | 'REJECTED') => {
    setUpdating(appId);
    try {
      const res = await fetch(`/api/applications/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setApplications(prev => prev.map(a => a._id === appId ? { ...a, status } : a));
        if (status === 'ACCEPTED' && onPostClosed) {
          onPostClosed();
        }
      }
    } finally {
      setUpdating(null);
    }
  };

  const handleReviewSuccess = (appId: string) => {
    setApplications(prev => prev.map(a => a._id === appId ? { ...a, hasReview: true } : a));
  };

  return (
    <Modal isOpen onClose={onClose} title={`Applications — ${postTitle}`} maxWidth="lg">
      {loading ? (
        <div className="flex justify-center py-8"><Spinner className="text-indigo-600" /></div>
      ) : applications.length === 0 ? (
        <EmptyState
          icon={<Users className="h-12 w-12" />}
          title="No applications yet"
          description="Applications from providers will appear here."
        />
      ) : (
        <div className="space-y-4">
          {applications.map(app => (
            <div key={app._id} className="rounded-lg border border-zinc-100 bg-zinc-50 p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button 
                      onClick={() => setViewingProfileId(app.providerId._id)}
                      className="font-semibold text-zinc-900 hover:text-indigo-600 transition-colors cursor-pointer text-left focus:outline-none"
                    >
                      {app.providerId.name}
                    </button>
                    {app.providerId.verifiedAt && (
                      <Badge variant="info" className="text-[10px] px-1.5 py-0">Verified</Badge>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500">{app.providerId.email}</p>
                  {app.providerId.reviewCount !== undefined && app.providerId.reviewCount > 0 && (
                    <button 
                      onClick={() => setViewingProfileId(app.providerId._id)}
                      className="flex items-center gap-0.5 text-xs text-amber-600 mt-0.5 hover:text-amber-700 transition-colors focus:outline-none"
                    >
                      <Star className="h-3 w-3 fill-current" />
                      {app.providerId.averageRating?.toFixed(1)}{' '}
                      <span className="text-zinc-400 hover:text-zinc-500">({app.providerId.reviewCount} reviews)</span>
                    </button>
                  )}
                  {app.providerId.bio && (
                    <p className="mt-1 text-xs text-zinc-600 line-clamp-2">{app.providerId.bio}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={app.status} />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-7 text-xs px-2 gap-1 bg-white"
                    onClick={() => setViewingProfileId(app.providerId._id)}
                  >
                    <User className="h-3 w-3" /> View Profile
                  </Button>
                </div>
              </div>

              <p className="text-sm text-zinc-700 bg-white rounded-md p-3 border border-zinc-100">
                {app.message}
              </p>
              <p className="text-xs text-zinc-400">Applied {new Date(app.createdAt).toLocaleDateString()}</p>

              <div className="flex flex-wrap gap-2 pt-1">
                {app.status === 'PENDING' && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleUpdateStatus(app._id, 'ACCEPTED')}
                      disabled={updating === app._id}
                      className="gap-1"
                    >
                      <CheckCircle className="h-3.5 w-3.5" /> Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleUpdateStatus(app._id, 'REJECTED')}
                      disabled={updating === app._id}
                      className="gap-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Reject
                    </Button>
                  </>
                )}
                {app.status === 'ACCEPTED' && !app.hasReview && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setReviewingApp(app)}
                    className="gap-1"
                  >
                    <Star className="h-3.5 w-3.5" /> Leave Review
                  </Button>
                )}
                {app.status === 'ACCEPTED' && app.hasReview && (
                  <Badge variant="success" className="gap-1 text-xs">
                    <Star className="h-3 w-3" /> Reviewed
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {reviewingApp && (
        <ReviewModal
          applicationId={reviewingApp._id}
          providerName={reviewingApp.providerId.name}
          onClose={() => setReviewingApp(null)}
          onSuccess={handleReviewSuccess}
        />
      )}

      {viewingProfileId && (
        <ProviderProfileModal
          providerId={viewingProfileId}
          onClose={() => setViewingProfileId(null)}
        />
      )}
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

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/auth/profile');
        const data = await res.json();
        if (data.success) {
          const u = data.user;
          setEmail(u.email);
          reset({
            name: u.name ?? '',
            bio: u.bio ?? '',
            city: u.location?.city ?? '',
            country: u.location?.country ?? '',
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
          location: { city: data.city || '', country: data.country || '' },
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

  const [myReviews, setMyReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);

  useEffect(() => {
    const loadReviews = async () => {
      try {
        const res = await fetch('/api/reviews/my');
        const data = await res.json();
        if (data.success) setMyReviews(data.reviews);
      } finally {
        setLoadingReviews(false);
      }
    };
    loadReviews();
  }, []);

  const handleDeleteReview = async (id: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    setDeletingReviewId(id);
    try {
      await fetch(`/api/reviews/${id}`, { method: 'DELETE' });
      setMyReviews(prev => prev.filter(r => r._id !== id));
    } finally {
      setDeletingReviewId(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-16"><Spinner className="text-indigo-600 h-8 w-8" /></div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="h-5 w-5 text-indigo-600" /> My Profile
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSave)} className="space-y-5 max-w-lg">
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={email} disabled className="bg-zinc-50 text-zinc-500" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-name">Display Name</Label>
            <Input id="p-name" {...register('name')} disabled={saving} />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-bio">Bio</Label>
            <Textarea
              id="p-bio"
              rows={3}
              placeholder="Tell providers a bit about yourself..."
              {...register('bio')}
              disabled={saving}
              className="min-h-20"
            />
            {errors.bio && <p className="text-xs text-red-500">{errors.bio.message}</p>}
          </div>
          <div>
            <Label className="flex items-center gap-1.5 mb-3">
              <MapPin className="h-4 w-4 text-zinc-400" /> Location
            </Label>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="p-city">City</Label>
                <Input id="p-city" placeholder="e.g. New York" {...register('city')} disabled={saving} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-country">Country</Label>
                <Input id="p-country" placeholder="e.g. United States" {...register('country')} disabled={saving} />
              </div>
            </div>
          </div>
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md border border-red-100">{error}</div>
          )}
          {saveSuccess && (
            <div className="bg-emerald-50 text-emerald-700 text-sm p-3 rounded-md border border-emerald-100 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" /> Profile saved successfully!
            </div>
          )}
          <Button type="submit" disabled={saving} className="gap-2">
            {saving ? <Spinner className="h-4 w-4 text-white" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving…' : 'Save Profile'}
          </Button>
        </form>
      </CardContent>
    </Card>

      {/* My Reviews Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Star className="h-5 w-5 text-indigo-600" /> My Reviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingReviews ? (
            <div className="flex justify-center py-6"><Spinner className="text-indigo-600 h-6 w-6" /></div>
          ) : myReviews.length === 0 ? (
            <div className="text-sm text-zinc-500 py-6 text-center border border-dashed border-zinc-200 rounded-lg">
              You haven't left any reviews yet.
            </div>
          ) : (
            <div className="space-y-4">
              {myReviews.map(review => (
                <div key={review._id} className="p-4 rounded-lg border border-zinc-100 bg-zinc-50 relative group">
                  <div className="flex items-start justify-between mb-2 pr-8">
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">
                        {review.providerId?.name || 'Unknown Provider'}
                      </p>
                      {review.applicationId?.postId?.title && (
                        <p className="text-xs text-zinc-500 mt-0.5">
                          For: {review.applicationId.postId.title}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-amber-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={cn("h-3.5 w-3.5", i < review.rating ? "fill-current" : "text-zinc-200")} />
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-zinc-700 mt-2 bg-white p-3 rounded-md border border-zinc-100">{review.comment}</p>
                  )}
                  <p className="text-xs text-zinc-400 mt-3 align-right">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                  
                  {/* Delete Button */}
                  <button
                    onClick={() => handleDeleteReview(review._id)}
                    disabled={deletingReviewId === review._id}
                    className="absolute top-4 right-4 text-zinc-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-50"
                    title="Delete Review"
                  >
                    {deletingReviewId === review._id ? <Spinner className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

type Tab = 'posts' | 'profile';

export default function SeekerDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);

  // Enhanced form state
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [milestones, setMilestones] = useState<MilestoneInput[]>([]);
  const [showSkills, setShowSkills] = useState(false);
  const [showMilestones, setShowMilestones] = useState(false);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<PostFormValues>({
    resolver: zodResolver(postSchema),
    defaultValues: { category: 'Web Development', remote: false },
  });

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/posts/my');
      const data = await res.json();
      if (data.success) setPosts(data.posts);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  // Fetch available skills for the form
  useEffect(() => {
    fetch('/api/skills').then(r => r.json()).then(d => {
      if (d.success) setAllSkills(d.skills);
    }).catch(() => {});
  }, []);

  const addMilestone = () => setMilestones(prev => [...prev, { title: '', amount: '', dueDate: '' }]);
  const removeMilestone = (i: number) => setMilestones(prev => prev.filter((_, idx) => idx !== i));
  const updateMilestone = (i: number, field: keyof MilestoneInput, value: string) =>
    setMilestones(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: value } : m));

  const handleEditPost = (post: Post) => {
    setEditingPostId(post._id);
    setValue('title', post.title);
    setValue('category', post.category as any);
    setValue('budget', post.budget);
    setValue('description', post.description);
    setValue('city', post.location?.city || '');
    setValue('country', post.location?.country || '');
    setValue('remote', post.location?.remote || false);
    setSelectedSkills(post.requiredSkills?.map(s => s._id) || []);
    setMilestones([]); // Keep simple; milesones are not fully supported in simple edit
    setShowSkills(post.requiredSkills && post.requiredSkills.length > 0 ? true : false);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSubmit = async (data: PostFormValues) => {
    setSubmitting(true);
    setFormError('');
    try {
      const payload = {
        title: data.title,
        description: data.description,
        category: data.category,
        budget: data.budget,
        requiredSkills: selectedSkills,
        location: {
          city: data.city || undefined,
          country: data.country || undefined,
          remote: data.remote || false,
        },
        milestones: milestones
          .filter(m => m.title.trim() && !isNaN(parseFloat(m.amount)))
          .map(m => ({
            title: m.title.trim(),
            amount: parseFloat(m.amount),
            dueDate: m.dueDate || undefined,
          })),
      };

      const method = editingPostId ? 'PATCH' : 'POST';
      const url = editingPostId ? `/api/posts/${editingPostId}` : '/api/posts';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || (editingPostId ? 'Failed to update post' : 'Failed to create post'));
      
      reset();
      setSelectedSkills([]);
      setMilestones([]);
      setShowForm(false);
      setShowSkills(false);
      setShowMilestones(false);
      setEditingPostId(null);
      fetchPosts();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (post: Post) => {
    setTogglingId(post._id);
    try {
      const newStatus = post.status === 'OPEN' ? 'CLOSED' : 'OPEN';
      await fetch(`/api/posts/${post._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      setPosts(prev => prev.map(p => p._id === post._id ? { ...p, status: newStatus } : p));
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Delete this post? All its applications will also be removed.')) return;
    setDeletingId(postId);
    try {
      await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
      setPosts(prev => prev.filter(p => p._id !== postId));
    } finally {
      setDeletingId(null);
    }
  };

  const totalPosts = posts.length;
  const openPosts = posts.filter(p => p.status === 'OPEN').length;
  const totalApplications = posts.reduce((a, p) => a + p.applicationCount, 0);
  const pendingApplications = posts.reduce((a, p) => a + p.pendingCount, 0);

  return (
    <div className="space-y-6">
      {/* Header + Tabs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Seeker Dashboard</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Manage your posts and profile</p>
        </div>
        {activeTab === 'posts' && (
          <Button onClick={() => { 
            if (showForm) {
              setShowForm(false);
            } else {
              setEditingPostId(null);
              reset();
              setSelectedSkills([]);
              setMilestones([]);
              setShowForm(true);
            }
            setFormError(''); 
          }} className="gap-2 self-start sm:self-auto">
            <Plus className="h-4 w-4" />
            {showForm ? 'Cancel' : 'New Post'}
          </Button>
        )}
      </div>

      {/* Tab Nav */}
      <div className="flex border-b border-zinc-200">
        {(['posts', 'profile'] as Tab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors capitalize',
              activeTab === tab
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-zinc-500 hover:text-zinc-700'
            )}
          >
            {tab === 'posts' ? (
              <span className="flex items-center gap-1.5">
                <Briefcase className="h-4 w-4" /> My Posts
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <User className="h-4 w-4" /> Profile
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Posts Tab ── */}
      {activeTab === 'posts' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Total Posts"       value={totalPosts}        icon={<FileText className="h-5 w-5 text-indigo-600" />} color="bg-indigo-50" />
            <StatCard label="Open Posts"        value={openPosts}         icon={<Briefcase className="h-5 w-5 text-emerald-600" />} color="bg-emerald-50" />
            <StatCard label="Total Applications" value={totalApplications} icon={<Users className="h-5 w-5 text-amber-600" />}   color="bg-amber-50" />
            <StatCard label="Pending Review"    value={pendingApplications} icon={<Clock className="h-5 w-5 text-rose-600" />}   color="bg-rose-50" />
          </div>

          {/* Create Post Form */}
          {showForm && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{editingPostId ? 'Edit Post' : 'Create New Post'}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {formError && (
                    <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md border border-red-100">{formError}</div>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Title */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="title">Title</Label>
                      <Input id="title" placeholder="e.g. Build a React dashboard" {...register('title')} disabled={submitting} />
                      {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
                    </div>

                    {/* Category */}
                    <div className="space-y-1.5">
                      <Label htmlFor="category">Category</Label>
                      <Select id="category" {...register('category')} disabled={submitting}>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </Select>
                    </div>

                    {/* Budget */}
                    <div className="space-y-1.5">
                      <Label htmlFor="budget">Budget (USD)</Label>
                      <Input id="budget" type="number" min={0} placeholder="500" {...register('budget')} disabled={submitting} />
                      {errors.budget && <p className="text-xs text-red-500">{errors.budget.message}</p>}
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        rows={4}
                        placeholder="Describe what you need in detail..."
                        {...register('description')}
                        disabled={submitting}
                        className="min-h-28"
                      />
                      {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
                    </div>

                    {/* Location */}
                    <div className="space-y-1.5">
                      <Label htmlFor="post-city">City <span className="text-zinc-400">(optional)</span></Label>
                      <Input id="post-city" placeholder="e.g. San Francisco" {...register('city')} disabled={submitting} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="post-country">Country <span className="text-zinc-400">(optional)</span></Label>
                      <Input id="post-country" placeholder="e.g. United States" {...register('country')} disabled={submitting} />
                    </div>

                    {/* Remote toggle */}
                    <div className="sm:col-span-2">
                      <label className="flex items-center gap-2 cursor-pointer w-fit">
                        <input
                          type="checkbox"
                          {...register('remote')}
                          disabled={submitting}
                          className="h-4 w-4 rounded border-zinc-300 text-indigo-600"
                        />
                        <span className="text-sm text-zinc-700">Remote-friendly position</span>
                      </label>
                    </div>
                  </div>

                  {/* Required Skills (collapsible) */}
                  <div className="border border-zinc-200 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setShowSkills(v => !v)}
                      className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 rounded-lg"
                    >
                      <span>
                        Required Skills
                        {selectedSkills.length > 0 && (
                          <span className="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700">
                            {selectedSkills.length} selected
                          </span>
                        )}
                      </span>
                      {showSkills ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    {showSkills && allSkills.length > 0 && (
                      <div className="px-4 pb-4">
                        <SkillsSelector
                          skills={allSkills}
                          selected={selectedSkills}
                          onChange={setSelectedSkills}
                        />
                      </div>
                    )}
                  </div>

                  {/* Milestones (collapsible) */}
                  <div className="border border-zinc-200 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setShowMilestones(v => !v)}
                      className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 rounded-lg"
                    >
                      <span>
                        Milestones
                        {milestones.length > 0 && (
                          <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
                            {milestones.length}
                          </span>
                        )}
                      </span>
                      {showMilestones ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    {showMilestones && (
                      <div className="px-4 pb-4 space-y-2">
                        {milestones.map((m, i) => (
                          <div key={i} className="flex gap-2 items-center">
                            <Input
                              placeholder="Milestone title"
                              value={m.title}
                              onChange={e => updateMilestone(i, 'title', e.target.value)}
                              disabled={submitting}
                              className="flex-1"
                            />
                            <Input
                              type="number"
                              placeholder="$"
                              value={m.amount}
                              onChange={e => updateMilestone(i, 'amount', e.target.value)}
                              disabled={submitting}
                              className="w-20"
                              min={0}
                            />
                            <Input
                              type="date"
                              value={m.dueDate}
                              onChange={e => updateMilestone(i, 'dueDate', e.target.value)}
                              disabled={submitting}
                              className="w-36"
                            />
                            <button
                              type="button"
                              onClick={() => removeMilestone(i)}
                              className="text-zinc-400 hover:text-red-500 shrink-0"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        <Button type="button" size="sm" variant="outline" onClick={addMilestone} className="gap-1 mt-1">
                          <Plus className="h-3.5 w-3.5" /> Add Milestone
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button type="submit" disabled={submitting}>
                      {submitting ? <Spinner className="mr-2 h-4 w-4 text-white" /> : null}
                      {submitting ? (editingPostId ? 'Updating…' : 'Publishing…') : (editingPostId ? 'Save Changes' : 'Publish Post')}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => {
                      setShowForm(false);
                      setEditingPostId(null);
                      reset();
                      setSelectedSkills([]);
                      setMilestones([]);
                      setFormError('');
                    }}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Posts List */}
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 mb-4">My Posts</h2>
            {loading ? (
              <div className="flex justify-center py-16">
                <Spinner className="text-indigo-600 h-8 w-8" />
              </div>
            ) : posts.length === 0 ? (
              <Card>
                <CardContent className="p-0">
                  <EmptyState
                    icon={<Briefcase className="h-12 w-12" />}
                    title="No posts yet"
                    description="Create your first service post to start receiving applications."
                    action={
                      <Button onClick={() => setShowForm(true)} className="gap-2">
                        <Plus className="h-4 w-4" /> Create First Post
                      </Button>
                    }
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {posts.map(post => (
                  <Card key={post._id} className={cn(post.status === 'CLOSED' && 'opacity-70')}>
                    <div className="p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="font-semibold text-zinc-900 truncate">{post.title}</h3>
                            <PostStatusBadge status={post.status} />
                            <Badge variant="default">{post.category}</Badge>
                          </div>
                          <p className="text-sm text-zinc-500 line-clamp-2">{post.description}</p>

                          {/* Skills & location chips */}
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {post.requiredSkills?.map(s => (
                              <span key={s._id} className="text-[11px] rounded-full bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-indigo-700">
                                {s.name}
                              </span>
                            ))}
                            {post.location?.city && (
                              <span className="flex items-center gap-0.5 text-[11px] text-zinc-400">
                                <MapPin className="h-3 w-3" /> {post.location.city}
                                {post.location.country && `, ${post.location.country}`}
                              </span>
                            )}
                            {post.location?.remote && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Remote</Badge>
                            )}
                          </div>

                          <div className="mt-2 flex flex-wrap gap-4 text-xs text-zinc-500">
                            <span className="font-medium text-indigo-600">${post.budget.toLocaleString()}</span>
                            <span>
                              <span className="font-medium text-zinc-700">{post.applicationCount}</span> applications
                              {post.pendingCount > 0 && (
                                <span className="ml-1 text-amber-600">({post.pendingCount} pending)</span>
                              )}
                            </span>
                            <span>Posted {new Date(post.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedPost(post)}
                            className="gap-1"
                          >
                            <Users className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Applications</span>
                            {post.applicationCount > 0 && (
                              <span className="bg-indigo-600 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                                {post.applicationCount}
                              </span>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            title="Edit post"
                            onClick={() => handleEditPost(post)}
                            className="text-zinc-600 hover:text-indigo-600 hover:bg-indigo-50"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            title={post.status === 'OPEN' ? 'Close post' : 'Reopen post'}
                            onClick={() => handleToggleStatus(post)}
                            disabled={togglingId === post._id}
                            className="text-zinc-600"
                          >
                            {post.status === 'OPEN'
                              ? <ToggleRight className="h-4 w-4 text-emerald-600" />
                              : <ToggleLeft className="h-4 w-4 text-zinc-400" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            title="Delete post"
                            onClick={() => handleDelete(post._id)}
                            disabled={deletingId === post._id}
                            className="text-red-500 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <button
                            onClick={() => setExpandedPost(expandedPost === post._id ? null : post._id)}
                            className="text-zinc-400 hover:text-zinc-600"
                          >
                            {expandedPost === post._id
                              ? <ChevronUp className="h-4 w-4" />
                              : <ChevronDown className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      {expandedPost === post._id && (
                        <div className="mt-4 pt-4 border-t border-zinc-100">
                          <p className="text-sm text-zinc-700 whitespace-pre-wrap">{post.description}</p>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Profile Tab ── */}
      {activeTab === 'profile' && <ProfileTab />}

      {/* Applications Modal */}
      {selectedPost && (
        <ApplicationsPanel
          postId={selectedPost._id}
          postTitle={selectedPost.title}
          onClose={() => setSelectedPost(null)}
          onPostClosed={() => {
            setPosts(prev => prev.map(p => p._id === selectedPost._id ? { ...p, status: 'CLOSED' } : p));
          }}
        />
      )}
    </div>
  );
}
