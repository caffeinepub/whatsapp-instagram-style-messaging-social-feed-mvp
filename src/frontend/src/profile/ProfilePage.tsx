import { useState } from 'react';
import { useGetCallerUserProfile, useSaveCallerUserProfile } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Edit2, Save, X } from 'lucide-react';
import LoadingState from '../components/states/LoadingState';
import ErrorState from '../components/states/ErrorState';
import LoginButton from '../auth/LoginButton';
import { validateUsername, validateDisplayName } from '../validation/validators';

export default function ProfilePage() {
  const { data: profile, isLoading, isError, error, refetch } = useGetCallerUserProfile();
  const saveProfileMutation = useSaveCallerUserProfile();
  
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [errors, setErrors] = useState<{ username?: string; displayName?: string }>({});

  const handleEdit = () => {
    if (profile) {
      setDisplayName(profile.displayName);
      setUsername(profile.username);
      setBio(profile.bio);
      setIsEditing(true);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setErrors({});
  };

  const handleSave = async () => {
    const usernameError = validateUsername(username);
    const displayNameError = validateDisplayName(displayName);
    
    if (usernameError || displayNameError) {
      setErrors({
        username: usernameError,
        displayName: displayNameError,
      });
      return;
    }

    if (!profile) return;

    setErrors({});
    try {
      await saveProfileMutation.mutateAsync({
        ...profile,
        displayName,
        username,
        bio,
      });
      setIsEditing(false);
    } catch (err) {
      setErrors({ username: err instanceof Error ? err.message : 'Failed to save profile' });
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading profile..." />;
  }

  if (isError) {
    return (
      <div className="p-4 md:p-6">
        <ErrorState
          message={error instanceof Error ? error.message : 'Failed to load profile'}
          onRetry={refetch}
        />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-4 md:p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Profile not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 pb-24 md:p-6 md:pb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Profile</h1>
        <LoginButton />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Your Profile</CardTitle>
            {!isEditing && (
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Edit2 className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-2xl">
                {profile.displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {!isEditing && (
              <div>
                <h2 className="text-xl font-semibold">{profile.displayName}</h2>
                <p className="text-muted-foreground">@{profile.username}</p>
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className={errors.displayName ? 'border-destructive' : ''}
                />
                {errors.displayName && (
                  <p className="text-sm text-destructive">{errors.displayName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  className={errors.username ? 'border-destructive' : ''}
                />
                {errors.username && (
                  <p className="text-sm text-destructive">{errors.username}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  placeholder="Tell us about yourself..."
                />
              </div>

              {saveProfileMutation.isError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {saveProfileMutation.error instanceof Error
                      ? saveProfileMutation.error.message
                      : 'Failed to save profile. Please try again.'}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="flex-1"
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saveProfileMutation.isPending}
                  className="flex-1"
                >
                  {saveProfileMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Bio</Label>
                <p className="mt-1">{profile.bio || 'No bio yet'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Followers</Label>
                  <p className="mt-1 text-2xl font-semibold">{profile.followers.length}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Following</Label>
                  <p className="mt-1 text-2xl font-semibold">{profile.following.length}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
