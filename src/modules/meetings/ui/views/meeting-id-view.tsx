"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useConfirm } from "@/hooks/use-confirm";
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";

import { getMeeting, deleteMeeting, type Meeting } from "@/app/actions/meetings";
import { ActiveState } from "../components/active-state";
import { UpcomingState } from "../components/upcoming-state";
import { CancelledState } from "../components/cancelled-state";
import { ProcessingState } from "../components/processing-state";
import { UpdateMeetingDialog } from "../components/update-meeting-dialog";
import { MeetingIdViewHeader } from "../components/meeting-id-view-header";
import { CompletedState } from "../components/completed-state";

interface Props {
  meetingId: string;
}

export const MeetingIdView = ({ meetingId }: Props) => {
  const router = useRouter();
  const [data, setData] = useState<Meeting | null>(null);
  const [isPending, startTransition] = useTransition();
  const [updateMeetingDialogOpen, setUpdateMeetingDialogOpen] = useState(false);

  const [RemoveConfirmation, confirmRemove] = useConfirm(
    "Are you sure?",
    "The following action will remove this meeting"
  );

  useEffect(() => {
    startTransition(async () => {
      try {
        const result = await getMeeting(meetingId);
        setData(result);
      } catch {
        // handled by error state
      }
    });
  }, [meetingId]);

  const handleRemoveMeeting = async () => {
    const ok = await confirmRemove();
    if (!ok) return;

    startTransition(async () => {
      try {
        await deleteMeeting(meetingId);
        router.push("/meetings");
      } catch (error: unknown) {
        toast.error(error instanceof Error ? error.message : "Failed to delete meeting");
      }
    });
  };

  if (isPending && !data) {
    return <LoadingState title="Loading Meeting" description="This may take a few seconds" />;
  }

  if (!data) {
    return <ErrorState title="Meeting Not Found" description="Please try again later" />;
  }

  const isActive = data.status === "active";
  const isUpcoming = data.status === "upcoming";
  const isCancelled = data.status === "cancelled";
  const isCompleted = data.status === "completed";
  const isProcessing = data.status === "processing";

  return (
    <>
      <RemoveConfirmation />
      <UpdateMeetingDialog
        open={updateMeetingDialogOpen}
        onOpenChange={setUpdateMeetingDialogOpen}
        initialValues={data}
      />
      <div className="flex-1 py-4 px-4 md:px-8 flex flex-col gap-y-4">
        <MeetingIdViewHeader
          meetingId={meetingId}
          meetingName={data.name}
          onEdit={() => setUpdateMeetingDialogOpen(true)}
          onRemove={handleRemoveMeeting}
        />
        {isCancelled && <CancelledState />}
        {isProcessing && <ProcessingState />}
        {isCompleted && <CompletedState data={data} />}
        {isActive && <ActiveState meetingId={meetingId} />}
        {isUpcoming && <UpcomingState meetingId={meetingId} />}
      </div>
    </>
  );
};

export const MeetingIdViewLoading = () => {
  return <LoadingState title="Loading Meeting" description="This may take a few seconds" />;
};

export const MeetingIdViewError = () => {
  return <ErrorState title="Error Loading Meeting" description="Please try again later" />;
};