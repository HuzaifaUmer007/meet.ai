import { CallView } from "@/modules/call/ui/views/call-view";

interface Props {
  params: Promise<{ meetingId: string }>;
}

const Page = async ({ params }: Props) => {
  const { meetingId } = await params;

  return <CallView meetingId={meetingId} />;
};

export default Page;
