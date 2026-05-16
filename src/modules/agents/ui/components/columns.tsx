import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ColumnDef } from "@tanstack/react-table"
import { CornerDownRightIcon, VideoIcon, TrashIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { GeneratedAvatar } from "@/components/generated-avatar"
import { useConfirm } from "@/hooks/use-confirm";

import { type Agent, deleteAgent } from "@/app/actions/agents"

const AgentActions = ({ id, name }: { id: string, name: string }) => {
  const [ConfirmationDialog, confirm] = useConfirm(
    "Delete Agent",
    `Are you sure you want to delete "${name}"? This will also remove the agent from any associated meetings.`
  );
  const [isPending, startTransition] = useTransition();

  const onDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const ok = await confirm();
    if (!ok) return;

    startTransition(async () => {
      try {
        await deleteAgent(id);
        toast.success("Agent deleted successfully");
        // Dispatch event for auto-refresh
        window.dispatchEvent(new Event("agent-deleted"));
      } catch (err) {
        toast.error("Failed to delete agent");
      }
    });
  };

  return (
    <div className="flex justify-end gap-x-2" onClick={(e) => e.stopPropagation()}>
      <ConfirmationDialog />
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={onDelete} 
        disabled={isPending}
        className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
      >
        <TrashIcon className="size-4" />
      </Button>
    </div>
  );
};

export const columns: ColumnDef<Agent>[] = [
  {
    accessorKey: "name",
    header: "Agent Name",
    cell: ({ row }) => (
      <div className="flex flex-col gap-y-1">
        <div className="flex items-center gap-x-2">
          <GeneratedAvatar
            variant="botttsNeutral"
            seed={row.original.name}
            className="size-6"
          />
          <span className="font-semibold capitalize">{row.original.name}</span>
        </div>
        <div className="flex items-center gap-x-2">
          <CornerDownRightIcon className="size-3 text-muted-foreground" />
          <span className="text-sm text-muted-foreground max-w-[200px] truncate capitalize">
            {row.original.instructions}
          </span>
        </div>
      </div>
    )
  },
  {
    accessorKey: "meeting_count",
    header: "Meetings",
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className="flex items-center gap-x-2 [&>svg]:size-4"
      >
        <VideoIcon className="text-blue-700" />
        {row.original.meeting_count} {row.original.meeting_count === 1 ? "meeting" : "meetings"}
      </Badge>
    )
  },
  {
    id: "actions",
    cell: ({ row }) => <AgentActions id={row.original.id} name={row.original.name} />
  }
]
