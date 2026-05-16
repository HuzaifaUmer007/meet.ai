import Link from "next/link"
import { VideoIcon, LinkIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/empty-state"

interface Props {
  meetingId: string;
}

export const UpcomingState = ({
  meetingId,
}: Props) => {
  const onCopy = () => {
    const url = `${window.location.origin}/call/${meetingId}`;
    navigator.clipboard.writeText(url);
    toast.success("Meeting link copied to clipboard");
  };

  return (
    <div className="bg-white rounded-lg px-4 py-5 flex flex-col gap-y-8 items-center justify-center">
      <EmptyState
        image="/processing.png"
        title="Not started yet"
        description="Once you start this meeting, a summary will appear here"
      />
      <div className="flex flex-col-reverse lg:flex-row lg:justify-center items-center gap-2 w-full">
        <Button onClick={onCopy} variant="outline" className="w-full lg:w-auto">
          <LinkIcon className="mr-2 size-4" />
          Copy Link
        </Button>
        <Button asChild className="w-full lg:w-auto">
          <Link href={`/call/${meetingId}`}>
            <VideoIcon className="mr-2 size-4" />
            Start meeting
          </Link>
        </Button>
      </div>
    </div>
  )
}