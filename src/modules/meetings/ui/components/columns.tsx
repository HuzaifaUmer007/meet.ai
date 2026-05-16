"use client"

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { ColumnDef } from "@tanstack/react-table"
import {
  CircleCheckIcon,
  CircleXIcon,
  ClockArrowUpIcon,
  ClockFadingIcon,
  CornerDownRightIcon,
  LinkIcon,
  LoaderIcon,
  TrashIcon,
  ZapIcon,
} from "lucide-react"
import { toast } from "sonner";

import { cn, formatDuration } from "@/lib/utils";
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button";
import { GeneratedAvatar } from "@/components/generated-avatar"
import { useConfirm } from "@/hooks/use-confirm";

import { type Meeting, deleteMeeting } from "@/app/actions/meetings"

const statusIconMap = {
  upcoming: ClockArrowUpIcon,
  active: LoaderIcon,
  completed: CircleCheckIcon,
  processing: LoaderIcon,
  cancelled: CircleXIcon,
};

const statusColorMap = {
  upcoming: "bg-yellow-500/20 text-yellow-800 border-yellow-800/5",
  active: "bg-blue-500/20 text-blue-800 border-blue-800/5",
  completed: "bg-emerald-500/20 text-emerald-800 border-emerald-800/5",
  cancelled: "bg-rose-500/20 text-rose-800 border-rose-800/5",
  processing: "bg-gray-300/20 text-gray-800 border-gray-800/5",
}

const MeetingActions = ({ id }: { id: string }) => {
  const [ConfirmationDialog, confirm] = useConfirm(
    "Delete Meeting",
    "Are you sure you want to delete this meeting? This action cannot be undone."
  );
  const [isPending, startTransition] = useTransition();

  const onCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/call/${id}`;
    navigator.clipboard.writeText(url);
    toast.success("Meeting link copied to clipboard");
  };

  const onDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const ok = await confirm();
    if (!ok) return;

    startTransition(async () => {
      try {
        await deleteMeeting(id);
        toast.success("Meeting deleted successfully");
        window.dispatchEvent(new Event("meeting-deleted"));
      } catch (err) {
        toast.error("Failed to delete meeting");
      }
    });
  };

  return (
    <div className="flex justify-end gap-x-2" onClick={(e) => e.stopPropagation()}>
      <ConfirmationDialog />
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={onCopy} 
        className="text-muted-foreground hover:text-foreground"
      >
        <LinkIcon className="size-4" />
      </Button>
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

export const columns: ColumnDef<Meeting>[] = [
  {
    accessorKey: "name",
    header: "Meeting Name",
    cell: ({ row }) => (
      <div className="flex flex-col gap-y-1">
        <span className="font-semibold capitalize">{row.original.name}</span>
        <div className="flex items-center gap-x-2">
          <div className="flex items-center gap-x-1">
            <CornerDownRightIcon className="size-3 text-muted-foreground" />
            <span className="text-sm text-muted-foreground max-w-[200px] truncate capitalize">
              {row.original.agent?.name ?? ""}
            </span>
          </div>
          <GeneratedAvatar
            variant="botttsNeutral"
            seed={row.original.agent?.name ?? ""}
            className="size-4"
          />
          <span className="text-sm text-muted-foreground">
            {row.original.started_at ? format(new Date(row.original.started_at), "MMM d") : ""}
          </span>
        </div>
      </div>
    )
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const Icon = statusIconMap[row.original.status as keyof typeof statusIconMap];

      return (
        <Badge
          variant="outline"
          className={cn(
            "capitalize [&>svg]:size-4 text-muted-foreground",
            statusColorMap[row.original.status as keyof typeof statusColorMap]
          )}
        >
          <Icon
            className={cn(
              row.original.status === "processing" && "animate-spin"
            )}
          />
          {row.original.status}
        </Badge>
      )
    },
  },
  {
    accessorKey: "duration",
    header: "Duration",
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className="capitalize [&>svg]:size-4 flex items-center gap-x-2"
      >
        <ClockFadingIcon className="text-blue-700" />
        {row.original.duration ? formatDuration(row.original.duration) : "No duration"}
      </Badge>
    ),
  },
  {
    accessorKey: "tokens_used",
    header: "Credits Used",
    cell: ({ row }) => {
      const tokens = row.original.tokens_used ?? 0;
      // Approximate cost: $15 per 1M tokens (GPT-4o average)
      const cost = (tokens / 1000000) * 15;
      
      return (
        <div className="flex flex-col gap-y-1">
          <Badge
            variant="outline"
            className="capitalize [&>svg]:size-4 flex items-center gap-x-2 bg-yellow-500/5 border-yellow-500/10 text-yellow-700"
          >
            <ZapIcon className="size-3 fill-yellow-700" />
            {tokens.toLocaleString()}
          </Badge>
          <span className="text-[10px] text-muted-foreground font-mono ml-1">
            ≈ ${cost.toFixed(4)}
          </span>
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <MeetingActions id={row.original.id} />
  }
];
