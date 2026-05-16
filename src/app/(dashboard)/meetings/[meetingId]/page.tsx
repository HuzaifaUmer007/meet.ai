import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import {
  MeetingIdView,
  MeetingIdViewError,
  MeetingIdViewLoading,
} from "@/modules/meetings/ui/views/meeting-id-view";

interface Props {
  params: Promise<{ meetingId: string }>;
}

const Page = async ({ params }: Props) => {
  const { meetingId } = await params;

  return (
    <Suspense fallback={<MeetingIdViewLoading />}>
      <ErrorBoundary fallback={<MeetingIdViewError />}>
        <MeetingIdView meetingId={meetingId} />
      </ErrorBoundary>
    </Suspense>
  );
};

export default Page;
