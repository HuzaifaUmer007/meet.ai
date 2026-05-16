"use client";

import { useEffect, useState } from "react";
import { LoaderIcon } from "lucide-react";
import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";
import { generateAvatarUri } from "@/lib/avatar";
import { CallConnect } from "./call-connect";

interface Props {
  meetingId: string;
  meetingName: string;
}

export const CallProvider = ({ meetingId, meetingName }: Props) => {
  const [user, setUser] = useState<User | null>(null);
  const [guestProfile, setGuestProfile] = useState<{ id: string; name: string } | null>(null);
  const [isPending, setIsPending] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser(data.user);
      } else {
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        setGuestProfile({
          id: `guest_${Math.random().toString(36).substr(2, 9)}`,
          name: `Guest ${randomNum}`,
        });
      }
      setIsPending(false);
    });
  }, []);

  if (isPending || (!user && !guestProfile)) {
    return (
      <div className="flex h-screen items-center justify-center bg-radial from-sidebar-accent to-sidebar">
        <LoaderIcon className="size-6 animate-spin text-white" />
      </div>
    );
  }

  const name = user ? (user.user_metadata?.full_name ?? user.email ?? "User") : guestProfile!.name;
  const id = user ? user.id : guestProfile!.id;
  const isGuest = !!guestProfile;

  const image =
    user?.user_metadata?.avatar_url ??
    generateAvatarUri({ seed: name, variant: "initials" });

  return (
    <CallConnect
      meetingId={meetingId}
      meetingName={meetingName}
      userId={id}
      userName={name}
      userImage={image}
      isGuest={isGuest}
    />
  );
};
