"use client";

import { useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { AppShell } from "@/components/layout/AppShell";
import { ProfileAvatar } from "@/components/ui/ProfileAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { Mail, User, LogOut, ArrowLeft, Boxes, Save, X, CheckCircle2, Pencil } from "lucide-react";
import { ChangePasswordSection } from "@/components/profile/ChangePasswordSection";

export default function InventoryProfilePage() {
  return (
    <AppShell requiredRole="inventory">
      <InventoryProfileContent />
    </AppShell>
  );
}

function InventoryProfileContent() {
  const { user, profile, loading, logout } = useAuth();
  const { currentUser, updateUserProfile } = useStore();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [draftName, setDraftName] = useState(profile?.name || currentUser?.name || "");
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(
    profile?.avatar_url || currentUser?.avatarUrl
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted">Loading profile...</p>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-red-500">No user data found. Please login again.</p>
      </div>
    );
  }

  const displayName = profile.name || currentUser?.name || "User";

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const handleSave = () => {
    updateUserProfile({
      name: draftName.trim() || displayName,
      avatarUrl,
    });
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleCancel = () => {
    setDraftName(displayName);
    setEditing(false);
  };

  const handleAvatarUploaded = (url: string) => {
    setAvatarUrl(url);
    updateUserProfile({ name: draftName.trim() || displayName, avatarUrl: url });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Inventory Clerk Profile</h1>
          <p className="text-sm text-muted">Your stock management account information</p>
        </div>
        <Button
          variant="ghost"
          onClick={() => router.push("/inventory")}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Inventory
        </Button>
      </div>

      {saved && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          Profile updated successfully.
        </div>
      )}

      <Card className="bg-slate-900 border-slate-700">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <ProfileAvatar
              src={avatarUrl}
              name={displayName}
              size={96}
              onUploaded={handleAvatarUploaded}
            />
            <div className="text-center sm:text-left flex-1">
              <p className="text-xl font-bold text-foreground">{displayName}</p>
              <p className="text-sm text-muted">{profile.email || user.email}</p>
              <div className="mt-2 flex flex-wrap justify-center sm:justify-start gap-2">
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                  {profile.status === "active" ? "Active" : "Inactive"}
                </Badge>
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                  Inventory Clerk
                </Badge>
              </div>
            </div>
            {!editing ? (
              <Button size="sm" variant="outline" onClick={() => { setDraftName(displayName); setEditing(true); }} className="gap-1.5">
                <Pencil className="h-3.5 w-3.5" /> Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Save className="h-3.5 w-3.5" /> Save
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancel} className="gap-1.5">
                  <X className="h-3.5 w-3.5" /> Cancel
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Boxes className="w-5 h-5" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-muted">Full Name</p>
              {editing ? (
                <div className="mt-1">
                  <Label htmlFor="profile-name" className="sr-only">Full Name</Label>
                  <Input
                    id="profile-name"
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    className="mt-1"
                  />
                </div>
              ) : (
                <p className="text-lg text-foreground mt-1">{displayName}</p>
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-muted">Email Address</p>
              <div className="flex items-center gap-2 mt-1">
                <Mail className="w-4 h-4 text-muted" />
                <p className="text-lg text-foreground">{profile.email || user.email}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-muted">Employee ID</p>
              <p className="text-sm text-foreground font-mono mt-1">{profile.id}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted">Employment Status</p>
              <div className="mt-1">
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                  {profile.status === "active" ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-muted">Employed Since</p>
              <p className="text-lg text-foreground mt-1">
                {profile.created_at
                  ? new Date(profile.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "N/A"}
              </p>
            </div>
          </div>

          {editing && (
            <div className="flex items-center gap-2 rounded-xl border border-teal-500/30 bg-teal-500/10 px-4 py-3 text-sm text-teal-300">
              <Pencil className="h-4 w-4 shrink-0" />
              Click the camera icon on your profile picture to upload a photo, and edit your name above.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Change Password */}
      <ChangePasswordSection />

      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={handleLogout}
            variant="destructive"
            className="w-full gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}