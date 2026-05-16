"use client";

import Link from "next/link";
import { LogInIcon, LinkIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  DefaultVideoPlaceholder,
  StreamVideoParticipant,
  ToggleAudioPreviewButton,
  ToggleVideoPreviewButton,
  useCallStateHooks,
  VideoPreview,
} from "@stream-io/video-react-sdk";
import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { generateAvatarUri } from "@/lib/avatar";

import "@stream-io/video-react-sdk/dist/css/styles.css";

interface Props {
  onJoin: () => void;
}

const DisabledVideoPreview = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const name = user?.user_metadata?.full_name ?? user?.email ?? "";
  const image =
    user?.user_metadata?.avatar_url ??
    generateAvatarUri({ seed: name, variant: "initials" });

  return (
    <DefaultVideoPlaceholder
      participant={{ name, image } as StreamVideoParticipant}
    />
  );
};

const AllowBrowserPermissions = () => {
  return (
    <p className="text-sm">
      Please grant your browser a permission to access your camera and
      microphone.
    </p>
  );
};

export const CallLobby = ({ onJoin }: Props) => {
  const { useCameraState, useMicrophoneState } = useCallStateHooks();
  const { hasBrowserPermission: hasMicPermission } = useMicrophoneState();
  const { hasBrowserPermission: hasCameraPermission } = useCameraState();
  const hasBrowserMediaPermission = hasCameraPermission && hasMicPermission;

  const onCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Meeting link copied to clipboard");
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-radial from-sidebar-accent to-sidebar">
      <div className="py-4 px-8 flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center justify-center gap-y-6 bg-background rounded-lg p-10 shadow-sm">
          <div className="flex flex-col gap-y-2 text-center">
            <h6 className="text-lg font-medium">Ready to join?</h6>
            <p className="text-sm">Set up your call before joining</p>
          </div>
          <VideoPreview
            DisabledVideoPreview={
              hasBrowserMediaPermission
                ? DisabledVideoPreview
                : AllowBrowserPermissions
            }
          />
          <div className="flex gap-x-2">
            <ToggleAudioPreviewButton />
            <ToggleVideoPreviewButton />
          </div>
          <div className="flex gap-x-2 justify-between w-full">
            <div className="flex gap-x-2">
              <Button asChild variant="ghost">
                <Link href="/meetings">Cancel</Link>
              </Button>
              <Button onClick={onCopy} variant="outline">
                <LinkIcon className="mr-2 size-4" />
                Copy Link
              </Button>
            </div>
            <Button onClick={onJoin}>
              <LogInIcon className="mr-2 size-4" />
              Join Call
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};