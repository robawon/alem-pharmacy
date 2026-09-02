"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, MapPin, CreditCard, ShieldCheck, CheckCircle2, Edit3, Save, X } from "lucide-react";
import { useStore } from "@/lib/store";

export default function AccountBillingPage() {
  const { currentUser } = useStore();
  const patientName = currentUser?.name || "Guest Patient";

  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState({
    name:    patientName,
    email:   "patient@email.com",
    phone:   "+251 91 234 5678",
    address: "Bole Sub-City, Addis Ababa",
  });
  const [draft, setDraft] = useState(profile);

  const handleSave = () => {
    setProfile(draft);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleCancel = () => {
    setDraft(profile);
    setEditing(false);
  };

  const initials = patientName.split(" ").map((n) => n[0]).join("").slice(0, 2);

  return (
    <AppShell requiredRole="customer">
      <div className="flex flex-col gap-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Account & Billing</h1>
          <p className="text-sm text-muted">Manage your personal profile, billing information, and account preferences.</p>
        </div>

        {saved && (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            Profile updated successfully.
          </div>
        )}

        {/* Profile Card */}
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-emerald-400" />
              <CardTitle className="text-foreground">Personal Profile</CardTitle>
            </div>
            {!editing ? (
              <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="gap-1.5 text-xs h-8">
                <Edit3 className="h-3.5 w-3.5" /> Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave} className="gap-1.5 text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Save className="h-3.5 w-3.5" /> Save
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancel} className="gap-1.5 text-xs h-8">
                  <X className="h-3.5 w-3.5" /> Cancel
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {/* Avatar Row */}
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 text-xl font-bold shadow-md">
                {initials}
              </div>
              <div>
                <p className="text-base font-bold text-foreground">{profile.name}</p>
                <Badge className="mt-1 bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">
                  Patient Account
                </Badge>
              </div>
            </div>

            {/* Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Full Name",       icon: User,    key: "name",    type: "text" },
                { label: "Email Address",   icon: Mail,    key: "email",   type: "email" },
                { label: "Phone Number",    icon: Phone,   key: "phone",   type: "tel" },
                { label: "Delivery Address",icon: MapPin,  key: "address", type: "text" },
              ].map(({ label, icon: Icon, key, type }) => (
                <div key={key} className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted flex items-center gap-1.5">
                    <Icon className="h-3 w-3" /> {label}
                  </Label>
                  {editing ? (
                    <Input type={type} value={draft[key as keyof typeof draft]}
                      onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} />
                  ) : (
                    <p className="text-sm text-foreground px-3 py-2 rounded-lg bg-surface-container-high border border-border">
                      {profile[key as keyof typeof profile]}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Billing Card */}
        <Card>
          <CardHeader className="flex-row items-center gap-2">
            <CreditCard className="h-5 w-5 text-teal-400" />
            <CardTitle className="text-foreground">Payment Methods</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {[
              { type: "Telebirr Mobile Wallet", last4: "7842", primary: true },
              { type: "Commercial Bank of Ethiopia", last4: "3311", primary: false },
            ].map((method, i) => (
              <div key={i} className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-surface-container-high/40">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/15 text-teal-400">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{method.type}</p>
                    <p className="text-xs text-muted">·· {method.last4}</p>
                  </div>
                </div>
                {method.primary && (
                  <Badge className="bg-teal-500/20 text-teal-300 border-teal-500/30 text-[10px]">Primary</Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader className="flex-row items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <CardTitle className="text-foreground">Account Security</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            {[
              { label: "Password Last Changed", value: "30 days ago" },
              { label: "Two-Factor Authentication", value: "Enabled via Telebirr" },
              { label: "Data Privacy", value: "Encrypted & HIPAA-compliant" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border/60 last:border-0">
                <span className="text-muted text-xs">{item.label}</span>
                <span className="text-foreground text-xs font-medium">{item.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
