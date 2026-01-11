import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Heart, Bookmark, MessageCircle, User, Settings, Zap, Sparkles, LogOut, Filter, Loader2, AlertCircle, X, Check } from 'lucide-react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface Profile {
  id: string;
  user_id: string;
  type: 'builder' | 'project' | 'investor';
  name: string;
  bio?: string;
  niches: string[];
  stage?: string;
  seeking_min?: number;
  seeking_max?: number;
  likes_today: number;
  is_premium: boolean;
  created_at: string;
}

interface BookmarkItem {
  id: string;
  profile_id: string;
  profile?: Profile;
  created_at: string;
}

interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  profile?: Profile;
}

const NICHES = ['DeFi', 'NFTs', 'Gaming', 'Infrastructure', 'DAOs', 'Payments', 'Social', 'Tooling', 'Memecoins', 'DePIN'];
const STAGES = ['Idea', 'Building', 'Beta', 'Launched', 'Scaling'];

const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) => (
  <div className={`fixed top-4 right-4 left-4 mx-auto max-w-sm z-50 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 ${
    type === 'success' ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 
    type === 'error' ? 'bg-gradient-to-r from-red-500 to-pink-500' : 
    'bg-gradient-to-r from-purple-500 to-indigo-500'
  } text-white`}>
    {type === 'success' && <Check className="w-5 h-5 flex-shrink-0" />}
    {type === 'error' && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
    <span className="font-medium flex-1">{message}</span>
    <button onClick={onClose} className="ml-2 hover:opacity-70 flex-shrink-0">✕</button>
  </div>
);

const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-12">
    <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
  </div>
);

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [screen, setScreen] = useState<'auth' | 'onboarding' | 'feed' | 'bookmarks' | 'matches' | 'profile'>('auth');
  const [feedProfiles, setFeedProfiles] = useState<Profile[]>([]);
  const [bookmarkedProfiles, setBookmarkedProfiles] = useState<BookmarkItem[]>([]);
  const [bookmarkIds, setBookmarkIds] = useState<Set<string>>(new Set());
  const [matches, setMatches] = useState<Match[]>([]);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [newMatch, setNewMatch] = useState<Profile | null>(null);
  const [filters, setFilters] = useState({ niches: [] as string[], stage: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (data) {
        setProfile(data);
        setScreen('feed');
        await loadFeed(data);
        await loadBookmarkIds(data.id);
      } else if (error?.code === 'PGRST116') {
        setScreen('onboarding');
      }
    } catch (err) {
      showToast('Failed to load profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadFeed = async (userProfile: Profile) => {
    setLoading(true);
    try {
      const oppositeTypes = userProfile.type === 'builder' ? ['project', 'investor'] : 
                           userProfile.type === 'project' ? ['builder', 'investor'] : 
                           ['builder', 'project'];
      
      let query = supabase
        .from('profiles')
        .select('*')
        .in('type', oppositeTypes)
        .neq('id', userProfile.id)
        .limit(50);

      if (filters.niches.length > 0) {
        query = query.overlaps('niches', filters.niches);
      }
      if (filters.stage) {
        query = query.eq('stage', filters.stage);
      }

      const { data } = await query;
      if (data) {
        setFeedProfiles(data);
      }
    } catch (err) {
      showToast('Failed to load feed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadBookmarkIds = async (profileId: string) => {
    try {
      const { data } = await supabase
        .from('bookmarks')
        .select('profile_id')
        .eq('user_id', profileId);

      if (data) {
        setBookmarkIds(new Set(data.map(b => b.profile_id)));
      }
    } catch (err) {
      console.error('Failed to load bookmark IDs', err);
    }
  };

  const loadBookmarks = async () => {
    if (!profile) return;
    setLoading(true);

    try {
      const { data } = await supabase
        .from('bookmarks')
        .select('*, profile:profile_id(*)')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (data) {
        setBookmarkedProfiles(data);
      }
    } catch (err) {
      showToast('Failed to load bookmarks', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async (profileId: string) => {
    if (!profile) return;

    try {
      const isBookmarked = bookmarkIds.has(profileId);

      if (isBookmarked) {
        await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', profile.id)
          .eq('profile_id', profileId);

        const newSet = new Set(bookmarkIds);
        newSet.delete(profileId);
        setBookmarkIds(newSet);
        showToast('Removed from bookmarks');
      } else {
        await supabase
          .from('bookmarks')
          .insert([{ user_id: profile.id, profile_id: profileId }]);

        setBookmarkIds(new Set([...bookmarkIds, profileId]));
        showToast('Saved! ⚡', 'success');
      }
    } catch (err) {
      showToast('Bookmark action failed', 'error');
    }
  };

  const handleLike = async (profileId: string) => {
    if (!profile) return;

    if (!profile.is_premium && profile.likes_today <= 0) {
      showToast('Daily limit reached! Go Premium 👑', 'error');
      return;
    }

    try {
      await supabase.from('swipes').insert([{
        swiper_id: profile.id,
        swiped_id: profileId,
        action: 'like'
      }]);

      if (!profile.is_premium) {
        await supabase
          .from('profiles')
          .update({ likes_today: profile.likes_today - 1 })
          .eq('id', profile.id);

        setProfile({ ...profile, likes_today: profile.likes_today - 1 });
      }

      const { data: reverseSwipe } = await supabase
        .from('swipes')
        .select('*')
        .eq('swiper_id', profileId)
        .eq('swiped_id', profile.id)
        .eq('action', 'like')
        .single();

      if (reverseSwipe) {
        await supabase.from('matches').insert([{
          user1_id: profile.id < profileId ? profile.id : profileId,
          user2_id: profile.id < profileId ? profileId : profile.id
        }]);

        const { data: matchedProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', profileId)
          .single();

        if (matchedProfile) {
          setNewMatch(matchedProfile);
          setShowMatchModal(true);
        }
      } else {
        showToast('Liked! ⚡', 'success');
      }

      setBookmarkedProfiles(prev => prev.filter(b => b.profile_id !== profileId));
    } catch (err) {
      showToast('Like failed', 'error');
    }
  };

  const loadMatches = async () => {
    if (!profile) return;
    setLoading(true);

    try {
      const { data } = await supabase
        .from('matches')
        .select('*')
        .or(`user1_id.eq.${profile.id},user2_id.eq.${profile.id}`);

      if (data) {
        const matchesWithProfiles = await Promise.all(
          data.map(async (match) => {
            const otherId = match.user1_id === profile.id ? match.user2_id : match.user1_id;
            const { data: otherProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', otherId)
              .single();
            return { ...match, profile: otherProfile };
          })
        );
        setMatches(matchesWithProfiles);
      }
    } catch (err) {
      showToast('Failed to load matches', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      showToast('Check your email! 📧', 'info');
    } catch (err: any) {
      showToast(err.message || 'Sign up failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (err: any) {
      showToast(err.message || 'Sign in failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setScreen('auth');
    showToast('Signed out');
  };

  const createProfile = async (data: Partial<Profile>) => {
    if (!currentUser) return;
    setLoading(true);

    try {
      // Validate and normalize type value
      const validTypes = ['builder', 'project', 'investor'];
      const profileType = (data.type && validTypes.includes(data.type)) 
        ? data.type 
        : 'builder';

      // Ensure required fields with defaults
      const profileData = {
        ...data,
        user_id: currentUser.id,
        type: profileType, // Normalized type value
        name: data.name || '',
        niches: data.niches || [],
        likes_today: data.likes_today ?? 20, // Default daily likes
        is_premium: data.is_premium ?? false,
      };

      const { data: newProfile, error } = await supabase
        .from('profiles')
        .insert([profileData])
        .select()
        .single();

      if (error) {
        console.error('Profile creation error:', error);
        console.error('Profile data sent:', profileData);
        // Provide more specific error message
        if (error.message?.includes('profiles_type_check')) {
          throw new Error(`Invalid profile type. Allowed values: builder, project, investor. You sent: ${profileData.type}`);
        }
        throw error;
      }

      if (newProfile) {
        setProfile(newProfile);
        setScreen('feed');
        await loadFeed(newProfile);
        await loadBookmarkIds(newProfile.id);
        showToast('Welcome to Seeker! ⚡', 'success');
      }
    } catch (err: any) {
      console.error('Create profile error:', err);
      showToast(err.message || 'Failed to create profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const upgradeToPremium = async () => {
    if (!profile) return;
    
    try {
      await supabase
        .from('profiles')
        .update({ is_premium: true, likes_today: 999 })
        .eq('id', profile.id);
      
      setProfile({ ...profile, is_premium: true, likes_today: 999 });
      showToast('🎉 Premium activated! Unlimited power!', 'success');
    } catch (err) {
      showToast('Upgrade failed', 'error');
    }
  };

  const AuthScreen = () => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-indigo-600 to-cyan-500 flex items-center justify-center p-4">
        <div className="bg-black/40 backdrop-blur-xl rounded-3xl shadow-2xl p-8 max-w-md w-full border border-white/10">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-cyan-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Zap className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">Seeker</h1>
            <p className="text-gray-300">Solana Talent Matching</p>
          </div>

          <div className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            <button
              onClick={() => isSignUp ? handleSignUp(email, password) : handleSignIn(email, password)}
              className="w-full bg-gradient-to-r from-purple-600 to-cyan-500 text-white py-3 rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="w-full text-cyan-300 py-2 text-sm hover:text-cyan-200 transition"
              disabled={loading}
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const OnboardingScreen = () => {
    const [formData, setFormData] = useState({
      type: 'builder' as 'builder' | 'project' | 'investor',
      name: '',
      bio: '',
      niches: [] as string[],
      stage: '',
      seeking_min: 0,
      seeking_max: 0
    });

    const toggleNiche = (niche: string) => {
      setFormData(prev => ({
        ...prev,
        niches: prev.niches.includes(niche)
          ? prev.niches.filter(n => n !== niche)
          : [...prev.niches, niche]
      }));
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 p-4 overflow-y-auto">
        <div className="max-w-2xl mx-auto bg-black/40 backdrop-blur-xl rounded-3xl shadow-xl p-8 mt-8 mb-8 border border-white/10">
          <h2 className="text-3xl font-bold mb-6 text-center text-white">Complete Your Profile</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">I am a...</label>
              <div className="grid grid-cols-3 gap-3">
                {['builder', 'project', 'investor'].map(type => (
                  <button
                    key={type}
                    onClick={() => setFormData({ ...formData, type: type as any })}
                    className={`p-4 rounded-xl border-2 transition ${
                      formData.type === type
                        ? 'border-purple-500 bg-purple-500/20'
                        : 'border-white/20 bg-white/5'
                    }`}
                  >
                    <p className="font-semibold capitalize text-white">{type}</p>
                  </button>
                ))}
              </div>
            </div>

            <input
              type="text"
              placeholder="Name"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-xl backdrop-blur-sm"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />

            <textarea
              placeholder="Bio"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-xl h-24 backdrop-blur-sm"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            />

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Niches</label>
              <div className="flex flex-wrap gap-2">
                {NICHES.map(niche => (
                  <button
                    key={niche}
                    onClick={() => toggleNiche(niche)}
                    className={`px-4 py-2 rounded-full text-sm transition ${
                      formData.niches.includes(niche)
                        ? 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white'
                        : 'bg-white/10 text-gray-300 border border-white/20'
                    }`}
                  >
                    {niche}
                  </button>
                ))}
              </div>
            </div>

            {formData.type === 'project' && (
              <>
                <select
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white rounded-xl backdrop-blur-sm"
                  value={formData.stage}
                  onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                >
                  <option value="" className="bg-gray-900">Select Stage</option>
                  {STAGES.map(stage => (
                    <option key={stage} value={stage} className="bg-gray-900">{stage}</option>
                  ))}
                </select>

                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    placeholder="Min funding ($)"
                    className="px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-xl backdrop-blur-sm"
                    value={formData.seeking_min || ''}
                    onChange={(e) => setFormData({ ...formData, seeking_min: parseInt(e.target.value) || 0 })}
                  />
                  <input
                    type="number"
                    placeholder="Max funding ($)"
                    className="px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-xl backdrop-blur-sm"
                    value={formData.seeking_max || ''}
                    onChange={(e) => setFormData({ ...formData, seeking_max: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </>
            )}

            <button
              onClick={() => {
                if (!formData.name.trim()) {
                  showToast('Please enter your name', 'error');
                  return;
                }
                if (formData.niches.length === 0) {
                  showToast('Please select at least one niche', 'error');
                  return;
                }
                createProfile(formData);
              }}
              className="w-full bg-gradient-to-r from-purple-600 to-cyan-500 text-white py-4 rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              Complete Profile
            </button>
          </div>
        </div>
      </div>
    );
  };

  const FeedScreen = () => {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 pb-20">
        <div className="bg-black/40 backdrop-blur-xl shadow-sm p-4 flex items-center justify-between border-b border-white/10 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Zap className="w-8 h-8 text-purple-400" />
            <span className="text-white font-bold text-xl">Seeker</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setShowFilters(true)}>
              <Filter className="w-6 h-6 text-gray-300 hover:text-white transition" />
            </button>
            <button onClick={() => setScreen('profile')}>
              <Settings className="w-6 h-6 text-gray-300 hover:text-white transition" />
            </button>
          </div>
        </div>

        {!profile?.is_premium && (
          <div className="bg-gradient-to-r from-purple-600/80 to-cyan-500/80 backdrop-blur-sm text-white p-3 text-center">
            <p className="text-sm">
              ⚡ {profile?.likes_today || 0}/20 likes left today.{' '}
              <button onClick={upgradeToPremium} className="underline font-semibold">
                Go Premium
              </button>
            </p>
          </div>
        )}

        <div className="p-3 text-center bg-purple-900/30 backdrop-blur-sm border-b border-white/10">
          <p className="text-sm text-gray-300">
            <Bookmark className="w-4 h-4 inline mr-1" />
            Save profiles, like them later ({bookmarkIds.size} saved)
          </p>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="max-w-7xl mx-auto p-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {feedProfiles.map(candidate => (
              <div key={candidate.id} className="bg-black/40 backdrop-blur-xl rounded-2xl shadow-lg overflow-hidden border border-white/10 hover:border-purple-500/50 transition">
                <div className="h-40 bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center">
                  <User className="w-20 h-20 text-white opacity-50" />
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-bold mb-1 text-white">{candidate.name}</h3>
                  <p className="text-xs text-cyan-400 mb-2 capitalize">{candidate.type}</p>
                  <p className="text-sm text-gray-300 mb-3 line-clamp-2">{candidate.bio}</p>
                  
                  <div className="flex flex-wrap gap-1 mb-3">
                    {candidate.niches.slice(0, 3).map(niche => (
                      <span key={niche} className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs border border-purple-500/30">
                        {niche}
                      </span>
                    ))}
                  </div>

                  {candidate.stage && (
                    <p className="text-xs text-gray-400 mb-1">Stage: {candidate.stage}</p>
                  )}
                  
                  {candidate.seeking_min && candidate.seeking_max && (
                    <p className="text-xs text-gray-400 mb-3">
                      ${(candidate.seeking_min / 1000)}K - ${(candidate.seeking_max / 1000)}K
                    </p>
                  )}

                  <button
                    onClick={() => handleBookmark(candidate.id)}
                    className={`w-full py-2.5 rounded-xl font-medium transition ${
                      bookmarkIds.has(candidate.id)
                        ? 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20 border border-white/20'
                    }`}
                  >
                    <Bookmark className="w-4 h-4 inline mr-1" />
                    {bookmarkIds.has(candidate.id) ? 'Saved' : 'Save'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <BottomNav />
      </div>
    );
  };

  const BookmarksScreen = () => {
    useEffect(() => {
      loadBookmarks();
    }, []);

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 pb-20">
        <div className="bg-black/40 backdrop-blur-xl shadow-sm p-4 border-b border-white/10 sticky top-0 z-10">
          <h1 className="text-2xl font-bold text-white">Saved</h1>
          <p className="text-sm text-gray-300">Like profiles from your saved list</p>
        </div>

        {!profile?.is_premium && (
          <div className="bg-purple-900/30 backdrop-blur-sm p-3 text-center border-b border-white/10">
            <p className="text-sm text-gray-300">
              ⚡ {profile?.likes_today || 0}/20 likes left today
            </p>
          </div>
        )}

        {loading ? (
          <LoadingSpinner />
        ) : bookmarkedProfiles.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Bookmark className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">No bookmarks yet</p>
            <button
              onClick={() => setScreen('feed')}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-500 text-white rounded-xl hover:opacity-90 transition"
            >
              Browse Feed
            </button>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto p-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {bookmarkedProfiles.map(bookmark => {
              const candidate = bookmark.profile;
              if (!candidate) return null;

              return (
                <div key={bookmark.id} className="bg-black/40 backdrop-blur-xl rounded-2xl shadow-lg overflow-hidden border border-white/10">
                  <div className="h-40 bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center">
                    <User className="w-20 h-20 text-white opacity-50" />
                  </div>
                  <div className="p-4">
                    <h3 className="text-xl font-bold mb-1 text-white">{candidate.name}</h3>
                    <p className="text-xs text-cyan-400 mb-2 capitalize">{candidate.type}</p>
                    <p className="text-sm text-gray-300 mb-3 line-clamp-2">{candidate.bio}</p>
                    
                    <div className="flex flex-wrap gap-1 mb-3">
                      {candidate.niches.slice(0, 3).map(niche => (<span key={niche} className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs border border-purple-500/30">
                          {niche}
                        </span>
                      ))}
                    </div>

                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => handleBookmark(candidate.id)}
                        className="flex-1 py-2.5 bg-white/10 rounded-xl font-medium hover:bg-white/20 transition border border-white/20 text-gray-300"
                      >
                        <X className="w-4 h-4 inline mr-1" />
                        Remove
                      </button>
                      <button
                        onClick={() => handleLike(candidate.id)}
                        className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-500 text-white rounded-xl font-medium hover:opacity-90 transition"
                        disabled={!profile?.is_premium && (profile?.likes_today ?? 0) <= 0}
                      >
                        <Heart className="w-4 h-4 inline mr-1" />
                        Like
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <BottomNav />
      </div>
    );
  };

  const MatchesScreen = () => {
    useEffect(() => {
      loadMatches();
    }, []);

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 pb-20">
        <div className="bg-black/40 backdrop-blur-xl shadow-sm p-4 border-b border-white/10 sticky top-0 z-10">
          <h1 className="text-2xl font-bold text-white">Matches</h1>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : matches.length === 0 ? (
          <div className="text-center py-12 px-4">
            <MessageCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">No matches yet. Start liking!</p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto p-4 space-y-4">
            {matches.map(match => (
              <div key={match.id} className="bg-black/40 backdrop-blur-xl rounded-2xl shadow-md p-4 flex items-center gap-4 border border-white/10">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-white">{match.profile?.name}</h3>
                  <p className="text-sm text-cyan-400 capitalize">{match.profile?.type}</p>
                </div>
                <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-500 text-white rounded-xl text-sm hover:opacity-90 transition">
                  Message
                </button>
              </div>
            ))}
          </div>
        )}

        <BottomNav />
      </div>
    );
  };

  const ProfileScreen = () => {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 pb-20">
        <div className="bg-black/40 backdrop-blur-xl shadow-sm p-4 border-b border-white/10 sticky top-0 z-10">
          <h1 className="text-2xl font-bold text-white">Profile</h1>
        </div>

        <div className="max-w-2xl mx-auto p-4">
          <div className="bg-black/40 backdrop-blur-xl rounded-3xl shadow-xl p-6 mb-4 border border-white/10">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-center mb-2 text-white">{profile?.name}</h2>
            <p className="text-center text-cyan-400 mb-4 capitalize">{profile?.type}</p>
            
            {!profile?.is_premium && (
              <button
                onClick={upgradeToPremium}
                className="w-full bg-gradient-to-r from-purple-600 to-cyan-500 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition shadow-lg"
              >
                <Sparkles className="w-5 h-5" />
                Go Premium - Unlimited Likes
              </button>
            )}

            {profile?.is_premium && (
              <div className="bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-xl p-4 text-center border border-purple-500/30">
                <Sparkles className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <p className="font-semibold text-white">Premium Member</p>
                <p className="text-sm text-gray-300">Unlimited likes activated!</p>
              </div>
            )}
          </div>

          <div className="bg-black/40 backdrop-blur-xl rounded-2xl shadow-md p-6 mb-4 border border-white/10">
            <h3 className="font-semibold mb-4 text-white">About</h3>
            <p className="text-gray-300">{profile?.bio || 'No bio yet'}</p>
          </div>

          <div className="bg-black/40 backdrop-blur-xl rounded-2xl shadow-md p-6 mb-4 border border-white/10">
            <h3 className="font-semibold mb-4 text-white">Niches</h3>
            <div className="flex flex-wrap gap-2">
              {profile?.niches.map(niche => (
                <span key={niche} className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm border border-purple-500/30">
                  {niche}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-xl rounded-2xl shadow-md p-6 mb-4 border border-white/10">
            <h3 className="font-semibold mb-2 text-white">Daily Stats</h3>
            <p className="text-sm text-gray-300">
              Bookmarks: {bookmarkIds.size} saved
            </p>
            <p className="text-sm text-gray-300">
              Likes today: {profile?.is_premium ? '∞' : `${profile?.likes_today}/20`}
            </p>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full bg-red-600/80 backdrop-blur-sm text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-red-700/80 transition border border-red-500/30"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>

        <BottomNav />
      </div>
    );
  };

  const BottomNav = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-black/60 backdrop-blur-xl border-t border-white/10 flex justify-around py-3 z-20">
      <button
        onClick={() => setScreen('feed')}
        className={`flex flex-col items-center min-w-[60px] ${screen === 'feed' ? 'text-purple-400' : 'text-gray-400'}`}
      >
        <Zap className="w-6 h-6" />
        <span className="text-xs mt-1">Feed</span>
      </button>
      <button
        onClick={() => setScreen('bookmarks')}
        className={`flex flex-col items-center relative min-w-[60px] ${screen === 'bookmarks' ? 'text-purple-400' : 'text-gray-400'}`}
      >
        <Bookmark className="w-6 h-6" />
        {bookmarkIds.size > 0 && (
          <span className="absolute -top-1 right-2 bg-gradient-to-r from-purple-600 to-cyan-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {bookmarkIds.size}
          </span>
        )}
        <span className="text-xs mt-1">Saved</span>
      </button>
      <button
        onClick={() => setScreen('matches')}
        className={`flex flex-col items-center min-w-[60px] ${screen === 'matches' ? 'text-purple-400' : 'text-gray-400'}`}
      >
        <MessageCircle className="w-6 h-6" />
        <span className="text-xs mt-1">Matches</span>
      </button>
      <button
        onClick={() => setScreen('profile')}
        className={`flex flex-col items-center min-w-[60px] ${screen === 'profile' ? 'text-purple-400' : 'text-gray-400'}`}
      >
        <User className="w-6 h-6" />
        <span className="text-xs mt-1">Profile</span>
      </button>
    </div>
  );

  const MatchModal = () => (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-black/60 backdrop-blur-xl border border-white/20 rounded-3xl p-8 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Heart className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold mb-2 text-white">It's a Match!</h2>
        <p className="text-gray-300 mb-6">You and {newMatch?.name} liked each other ⚡</p>
        <button
          onClick={() => {
            setShowMatchModal(false);
            setScreen('matches');
          }}
          className="w-full bg-gradient-to-r from-purple-600 to-cyan-500 text-white py-3 rounded-xl font-semibold hover:opacity-90 transition mb-2"
        >
          Send Message
        </button>
        <button
          onClick={() => setShowMatchModal(false)}
          className="w-full text-gray-400 py-2 hover:text-white transition"
        >
          Continue Browsing
        </button>
      </div>
    </div>
  );

  const FiltersModal = () => (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end z-50">
      <div className="bg-black/80 backdrop-blur-xl border-t border-white/20 rounded-t-3xl p-6 w-full max-h-[80vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6 text-white">Filters</h2>
        
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-gray-300">Niches</label>
          <div className="flex flex-wrap gap-2">
            {NICHES.map(niche => (
              <button
                key={niche}
                onClick={() => {
                  setFilters(prev => ({
                    ...prev,
                    niches: prev.niches.includes(niche)
                      ? prev.niches.filter(n => n !== niche)
                      : [...prev.niches, niche]
                  }));
                }}
                className={`px-4 py-2 rounded-full text-sm transition ${
                  filters.niches.includes(niche)
                    ? 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white'
                    : 'bg-white/10 text-gray-300 border border-white/20'
                }`}
              >
                {niche}
              </button>
            ))}
          </div>
        </div>

        {profile?.type === 'investor' && (
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-gray-300">Stage</label>
            <select
              className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white rounded-xl backdrop-blur-sm"
              value={filters.stage}
              onChange={(e) => setFilters({ ...filters, stage: e.target.value })}
            >
              <option value="" className="bg-gray-900">All Stages</option>
              {STAGES.map(stage => (
                <option key={stage} value={stage} className="bg-gray-900">{stage}</option>
              ))}
            </select>
          </div>
        )}

        <button
          onClick={() => {
            setShowFilters(false);
            if (profile) loadFeed(profile);
          }}
          className="w-full bg-gradient-to-r from-purple-600 to-cyan-500 text-white py-3 rounded-xl font-semibold hover:opacity-90 transition mb-2"
        >
          Apply Filters
        </button>
        <button
          onClick={() => setShowFilters(false)}
          className="w-full text-gray-400 py-2 hover:text-white transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  return (
    <div className="font-sans">
      {screen === 'auth' && <AuthScreen />}
      {screen === 'onboarding' && <OnboardingScreen />}
      {screen === 'feed' && <FeedScreen />}
      {screen === 'bookmarks' && <BookmarksScreen />}
      {screen === 'matches' && <MatchesScreen />}
      {screen === 'profile' && <ProfileScreen />}
      {showMatchModal && <MatchModal />}
      {showFilters && <FiltersModal />}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default App;