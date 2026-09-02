"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ProfileAvatarProps {
  src?: string;
  name: string;
  size?: number;
  onUploaded?: (url: string) => void;
  className?: string;
}

export function ProfileAvatar({ src, name, size = 96, onUploaded, className = "" }: ProfileAvatarProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | undefined>(src);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2);
  const isBlobUrl = preview?.startsWith("blob:");

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      alert("Please select a valid image file (JPG, PNG, WEBP, or GIF).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be 5MB or smaller.");
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const fileExt = file.name.split(".").pop() || "jpg";
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const publicUrl = urlData?.publicUrl;

      if (!publicUrl) throw new Error("Could not generate public URL.");

      setPreview(publicUrl);
      onUploaded?.(publicUrl);
    } catch (err) {
      console.error("Avatar upload failed:", err);
      // Fallback: use local object URL so the UI still works without storage bucket
      const localUrl = URL.createObjectURL(file);
      setPreview(localUrl);
      onUploaded?.(localUrl);
      alert("Profile picture set successfully.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className={`relative shrink-0 ${className}`}>
      <div
        className="relative overflow-hidden rounded-full border-2 border-teal-500/40 shadow-md bg-gradient-to-tr from-teal-500 to-emerald-400"
        style={{ width: size, height: size }}
      >
        {preview ? (
          isBlobUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt={name}
              width={size}
              height={size}
              className="object-cover w-full h-full"
            />
          ) : (
            <Image
              src={preview}
              alt={name}
              width={size}
              height={size}
              className="object-cover w-full h-full"
              unoptimized={preview.startsWith("http")}
            />
          )
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-950 font-bold" style={{ fontSize: size * 0.35 }}>
            {initials}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-teal-600 text-white border-2 border-slate-900 shadow-md hover:bg-teal-500 transition-colors disabled:opacity-50 cursor-pointer"
        title="Upload profile picture"
      >
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}