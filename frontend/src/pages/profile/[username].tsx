import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { ProfileView } from '@/components/ProfileView';
import api from '@/lib/api';

interface ProfileData {
  tensions: Array<{
    id: string;
    label: string;
    strength: number;
  }>;
  emotionalSignature: number[];
  loops: Array<{
    id: string;
    pattern: string;
    occurrences: number;
  }>;
  growthTimeline: Array<{
    id: string;
    type: 'breakthrough' | 'growth' | 'regression';
    date: string;
    description: string;
  }>;
  tone?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { username } = router.query;
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (username) {
      loadProfile(username as string);
    }
  }, [username]);

  const loadProfile = async (username: string) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch profile
      const profileResponse = await api.get(`/profiles/${username}`);
      const profile = profileResponse.data;

      // Fetch identity data
      const [tensionsResponse, loopsResponse, evolutionResponse] = await Promise.all([
        api.get(`/identity/${profile.id}/tensions`),
        api.get(`/identity/${profile.id}/loops`),
        api.get(`/identity/${profile.id}/evolution`),
      ]);

      // Mock emotional signature (would come from backend in real implementation)
      const emotionalSignature = Array.from({ length: 20 }, (_, i) => 
        0.3 + Math.sin(i * 0.5) * 0.4 + Math.random() * 0.2
      );

      setProfileData({
        tensions: tensionsResponse.data,
        emotionalSignature,
        loops: loopsResponse.data,
        growthTimeline: evolutionResponse.data,
        tone: 'soft'
      });
    } catch (err: any) {
      console.error('Failed to load profile:', err);
      setError(err.response?.data?.detail || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E0E0E] flex items-center justify-center">
        <div className="text-[#CBA35D] text-lg">Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0E0E0E] flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-lg mb-2">Error</div>
          <div className="text-[#BDBDBD]">{error}</div>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-[#0E0E0E] flex items-center justify-center">
        <div className="text-[#BDBDBD]">Profile not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0E0E0E]">
      <div className="max-w-7xl mx-auto py-8">
        <h1 className="text-3xl text-[#CBA35D] mb-2 px-4">@{username}</h1>
        <p className="text-[#BDBDBD] mb-8 px-4">Identity Profile</p>
        <ProfileView {...profileData} />
      </div>
    </div>
  );
}
