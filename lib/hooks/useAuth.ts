"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function getUser() {
      try {
        const supabase = createClient();
        
        // Get current user
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          setError(authError.message);
          setLoading(false);
          return;
        }

        if (authUser) {
          setUser(authUser);

          // Fetch user profile from profiles table
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", authUser.id)
            .single();

          if (profileError) {
            console.warn("Profile fetch error:", profileError);
            // Try to fall back to staff_profiles
            const { data: staffProfile } = await supabase
              .from("staff_profiles")
              .select("id, name, email, role, status, joined_at")
              .eq("id", authUser.id)
              .maybeSingle();

            if (staffProfile) {
              setProfile({
                id: staffProfile.id,
                email: staffProfile.email,
                name: staffProfile.name,
                role: staffProfile.role,
                status: staffProfile.status,
                created_at: staffProfile.joined_at,
              });
            } else {
              // Create default profile if not exists
              setProfile({
                id: authUser.id,
                email: authUser.email,
                name: authUser.user_metadata?.name || authUser.email?.split("@")[0] || "User",
                role: authUser.user_metadata?.role || "customer",
                status: "active",
              });
            }
          } else {
            setProfile(profileData);
          }
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching user:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoading(false);
      }
    }

    getUser();
  }, []);

  const logout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return { user, profile, loading, error, logout };
}
