"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, ShieldAlert, XCircle } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

type PendingUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  joined_at: string;
};

export default function AdminUserApprovalPage() {
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchPendingUsers() {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const { data, error: fetchError } = await supabase
        .from("staff_profiles")
        .select("id, name, email, role, joined_at")
        .eq("is_verified", false)
        .order("joined_at", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setUsers(data ?? []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unable to load pending users.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function approveUser(userId: string) {
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("staff_profiles")
        .update({ is_verified: true, is_active: true, status: "active" })
        .eq("id", userId);

      if (error) {
        throw error;
      }

      setUsers((prev) => prev.filter((user) => user.id !== userId));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not approve this user.";
      setError(message);
    }
  }

  async function rejectUser(userId: string) {
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("staff_profiles")
        .update({ is_verified: false, is_active: false, status: "suspended" })
        .eq("id", userId);

      if (error) {
        throw error;
      }

      setUsers((prev) => prev.filter((user) => user.id !== userId));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not reject this user.";
      setError(message);
    }
  }

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  return (
    <AppShell requiredRole="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">User Verification</h1>
          <p className="text-sm text-slate-400">
            Approve new users before they can access the pharmacy system.
          </p>
        </div>

        <Card className="border border-slate-800 bg-slate-900/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <ShieldAlert className="h-5 w-5 text-amber-400" />
              Pending approvals
            </CardTitle>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading pending users...
              </div>
            ) : users.length === 0 ? (
              <p className="text-sm text-slate-400">No users are waiting for approval.</p>
            ) : (
              <div className="space-y-3">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between gap-4 rounded-lg border border-slate-700 bg-slate-950/60 p-3"
                  >
                    <div>
                      <p className="font-medium text-white">{user.name}</p>
                      <p className="text-sm text-slate-400">{user.email}</p>
                      <p className="text-xs text-slate-500">Role: {user.role}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        className="bg-emerald-600 text-white hover:bg-emerald-500"
                        onClick={() => approveUser(user.id)}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Approve
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                        onClick={() => rejectUser(user.id)}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
