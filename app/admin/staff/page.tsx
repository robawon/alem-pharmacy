"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, ShieldCheck, KeyRound } from "lucide-react";
import { useStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { AdminResetPasswordModal, TargetUser } from "@/components/admin/AdminResetPasswordModal";

export default function AdminStaffPage() {
  const { staffProfiles } = useStore();
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<TargetUser | null>(null);

  const handleOpenResetModal = (staff: { id: string; name: string; email: string; role: string }) => {
    setSelectedUser({
      id: staff.id,
      name: staff.name,
      email: staff.email,
      role: staff.role,
    });
    setResetModalOpen(true);
  };

  return (
    <AppShell requiredRole="admin">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Staff & User Management</h1>
          <p className="text-sm text-muted">Manage clinical staff credentials, roles, and authorization status.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/20 text-teal-400">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{staffProfiles.length}</p>
                <p className="text-xs text-muted">Total Registered Accounts</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {staffProfiles.filter(s => s.status === "active").length}
                </p>
                <p className="text-xs text-muted">Active Authorized Staff</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Staff Roster</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {staffProfiles.map((staff) => (
              <div key={staff.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface-container-high/50 gap-4">
                <div>
                  <p className="text-sm font-medium">{staff.name}</p>
                  <p className="text-xs text-muted">{staff.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="primary" className="uppercase text-[10px]">{staff.role}</Badge>
                  <Badge variant={staff.status === "active" ? "success" : "destructive"}>{staff.status}</Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenResetModal(staff)}
                    className="ml-2 gap-1.5 border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 hover:text-amber-200"
                    title="Reset user password"
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    Reset Password
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <AdminResetPasswordModal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        targetUser={selectedUser}
      />
    </AppShell>
  );
}
