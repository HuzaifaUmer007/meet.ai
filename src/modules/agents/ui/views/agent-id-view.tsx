"use client";

import { toast } from "sonner";
import { useState, useEffect, useTransition } from "react";
import { VideoIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { useConfirm } from "@/hooks/use-confirm";
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { GeneratedAvatar } from "@/components/generated-avatar";

import { getAgent, deleteAgent, type Agent } from "@/app/actions/agents";
import { UpdateAgentDialog } from "../components/update-agent-dialog";
import { AgentIdViewHeader } from "../components/agent-id-view-header";

interface Props {
  agentId: string;
}

export const AgentIdView = ({ agentId }: Props) => {
  const router = useRouter();
  const [data, setData] = useState<Agent | null>(null);
  const [isPending, startTransition] = useTransition();
  const [updateAgentDialogOpen, setUpdateAgentDialogOpen] = useState(false);

  const [RemoveConfirmation, confirmRemove] = useConfirm(
    "Are you sure?",
    `The following action will remove this agent and its associated meetings`
  );

  useEffect(() => {
    startTransition(async () => {
      try {
        const result = await getAgent(agentId);
        setData(result);
      } catch {
        // handled by error state
      }
    });
  }, [agentId]);

  const handleRemoveAgent = async () => {
    const ok = await confirmRemove();
    if (!ok) return;

    startTransition(async () => {
      try {
        await deleteAgent(agentId);
        router.push("/agents");
      } catch (error: unknown) {
        toast.error(error instanceof Error ? error.message : "Failed to delete agent");
      }
    });
  };

  if (isPending && !data) {
    return <LoadingState title="Loading Agent" description="This may take a few seconds" />;
  }

  if (!data) {
    return <ErrorState title="Agent Not Found" description="Something went wrong" />;
  }

  return (
    <>
      <RemoveConfirmation />
      <UpdateAgentDialog
        open={updateAgentDialogOpen}
        onOpenChange={setUpdateAgentDialogOpen}
        initialValues={data}
      />
      <div className="flex-1 py-4 px-4 md:px-8 flex flex-col gap-y-4">
        <AgentIdViewHeader
          agentId={agentId}
          agentName={data.name}
          onEdit={() => setUpdateAgentDialogOpen(true)}
          onRemove={handleRemoveAgent}
        />
        <div className="bg-white rounded-lg border">
          <div className="px-4 py-5 gap-y-5 flex flex-col col-span-5">
            <div className="flex items-center gap-x-3">
              <GeneratedAvatar
                variant="botttsNeutral"
                seed={data.name}
                className="size-10"
              />
              <h2 className="text-2xl font-medium">{data.name}</h2>
            </div>
            <Badge variant="outline" className="flex items-center gap-x-2 [&>svg]:size-4">
              <VideoIcon className="text-blue-700" />
              {data.meeting_count} {data.meeting_count === 1 ? "meeting" : "meetings"}
            </Badge>
            <div className="flex flex-col gap-y-4">
              <p className="text-lg font-medium">Instructions</p>
              <p className="text-neutral-800">{data.instructions}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export const AgentIdViewLoading = () => {
  return <LoadingState title="Loading Agent" description="This may take a few seconds" />;
};

export const AgentIdViewError = () => {
  return <ErrorState title="Error Loading Agent" description="Something went wrong" />;
};