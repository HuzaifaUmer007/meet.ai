"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";
import { LoadingState } from "@/components/loading-state";
import { ChatUI } from "./chat-ui";

interface Props {
  meetingId: string;
  meetingName: string;
}

export const ChatProvider = ({ meetingId, meetingName }: Props) => {
  const [user, setUser] = useState<User | null>(null);
  const [isPending, setIsPending] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setIsPending(false);
    });
  }, []);

  if (isPending || !user) {
    return (
      <LoadingState
        title="Loading..."
        description="Please wait while we load the chat"
      />
    );
  }

  const name = user.user_metadata?.full_name ?? user.email ?? "User";
  const image = user.user_metadata?.avatar_url ?? "";

  return (
    <ChatUI
      meetingId={meetingId}
      meetingName={meetingName}
      userId={user.id}
      userName={name}
      userImage={image}
    />
  );
};