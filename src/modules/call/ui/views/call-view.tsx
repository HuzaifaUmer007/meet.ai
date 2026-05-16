"use client";

import { useEffect, useState } from "react";

import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { getPublicMeeting, type Meeting } from "@/app/actions/meetings";
import { CallProvider } from "../components/call-provider";

interface Props {
  meetingId: string;
}

export const CallView = ({ meetingId }: Props) => {
  const [data, setData] = useState<Meeting | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        const result = await getPublicMeeting(meetingId);
        setData(result);
      } catch {
        // handled below
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMeeting();
  }, [meetingId]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingState title="Loading meeting..." description="Please wait" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-screen items-center justify-center">
        <ErrorState title="Meeting not found" description="You can no longer join this meeting" />
      </div>
    );
  }

  if (data.status === "completed") {
    return (
      <div className="flex h-screen items-center justify-center">
        <ErrorState
          title="Meeting has ended"
          description="You can no longer join this meeting"
        />
      </div>
    );
  }

  return <CallProvider meetingId={meetingId} meetingName={data.name} />;
};
