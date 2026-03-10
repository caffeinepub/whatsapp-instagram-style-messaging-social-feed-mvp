import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  Bookmark,
  Edit2,
  Loader2,
  Save,
  ShieldBan,
  X,
} from "lucide-react";
import { useState } from "react";
import LoginButton from "../auth/LoginButton";
import { ProfilePrivacy } from "../backend";
import ErrorState from "../components/states/ErrorState";
import LoadingState from "../components/states/LoadingState";
import {
  useGetCallerUserProfile,
  useSaveCallerUserProfile,
  useSetProfilePrivacy,
} from "../hooks/useQueries";
import {
  validateDisplayName,
  validateUsername,
} from "../validation/validators";

export default function ProfilePage() {
  const {
    data: profile,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetCallerUserProfile();
  const saveProfileMutation = useSaveCallerUserProfile();
  const setPrivacyMutation = useSetProfilePrivacy();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [privacy, setPrivacy] = useState<ProfilePrivacy>(
    ProfilePrivacy.profilePublic,
  );
  const [errors, setErrors] = useState<{
    username?: string;
    displayName?: string;
  }>({});

  const handleEdit = () => {
    if (profile) {
      setDisplayName(profile.displayName);
      setUsername(profile.username);
      setBio(profile.bio);
      setPrivacy(profile.privacy);
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
      // Update privacy setting first if it changed
      if (privacy !== profile.privacy) {
        await setPrivacyMutation.mutateAsync(privacy);
      }

      // Then update profile
      await saveProfileMutation.mutateAsync({
        ...profile,
        displayName,
        username,
        bio,
        privacy,
      });
      setIsEditing(false);
    } catch (err) {
      setErrors({
        username: err instanceof Error ? err.message : "Failed to save profile",
      });
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading profile..." />;
  }

  if (isError) {
    return (
      <div className="p-4 md:p-6">
        <ErrorState
          message={
            error instanceof Error ? error.message : "Failed to load profile"
          }
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
                  className={errors.displayName ? "border-destructive" : ""}
                />
                {errors.displayName && (
                  <p className="text-sm text-destructive">
                    {errors.displayName}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  className={errors.username ? "border-destructive" : ""}
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

              <div className="space-y-3">
                <Label>Profile Privacy</Label>
                <RadioGroup
                  value={privacy}
                  onValueChange={(value) => setPrivacy(value as ProfilePrivacy)}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value={ProfilePrivacy.profilePublic}
                      id="public"
                    />
                    <Label
                      htmlFor="public"
                      className="font-normal cursor-pointer"
                    >
                      <span className="font-medium">Public</span> - Anyone can
                      find and view your profile
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value={ProfilePrivacy.profilePrivate}
                      id="private"
                    />
                    <Label
                      htmlFor="private"
                      className="font-normal cursor-pointer"
                    >
                      <span className="font-medium">Private</span> - Only
                      followers can view your profile
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={
                    saveProfileMutation.isPending ||
                    setPrivacyMutation.isPending
                  }
                >
                  {saveProfileMutation.isPending ||
                  setPrivacyMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Changes
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {profile.bio && (
                <div>
                  <Label className="text-muted-foreground">Bio</Label>
                  <p className="mt-1">{profile.bio}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Followers</Label>
                  <p className="text-2xl font-semibold">
                    {profile.followers.length}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Following</Label>
                  <p className="text-2xl font-semibold">
                    {profile.following.length}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Privacy</Label>
                <p className="mt-1 capitalize">
                  {profile.privacy === ProfilePrivacy.profilePublic
                    ? "Public"
                    : "Private"}
                </p>
              </div>

              <div className="pt-4 space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate({ to: "/saved" })}
                >
                  <Bookmark className="mr-2 h-4 w-4" />
                  Saved Posts
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate({ to: "/blocked-users" })}
                >
                  <ShieldBan className="mr-2 h-4 w-4" />
                  Blocked Users
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
