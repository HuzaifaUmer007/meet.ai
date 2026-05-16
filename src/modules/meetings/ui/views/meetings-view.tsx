"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { DataTable } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { DataPagination } from "@/components/data-pagination";
import { getMeetings, type Meeting } from "@/app/actions/meetings";

import { columns } from "../components/columns";
import { useMeetingsFilters } from "../../hooks/use-meetings-filters";

export const MeetingsView = () => {
  const router = useRouter();
  const [filters, setFilters] = useMeetingsFilters();
  const [data, setData] = useState<{ items: Meeting[]; totalPages: number } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // Check for stripe success parameter
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("success") === "true") {
      toast.success("Welcome to Pro! Your plan has been upgraded successfully.", {
        duration: 5000,
      });
      // Remove the success param from URL without refreshing
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const fetchMeetings = () => {
      startTransition(async () => {
        const result = await getMeetings({
          ...filters,
          status: filters.status ?? undefined,
        });
        setData(result);
      });
    };

    fetchMeetings();

    window.addEventListener("meeting-deleted", fetchMeetings);
    return () => window.removeEventListener("meeting-deleted", fetchMeetings);
  }, [filters, isMounted]);

  if (isPending && !data) {
    return <LoadingState title="Loading Meetings" description="This may take a few seconds" />;
  }

  if (!data) return null;

  return (
    <div className="flex-1 pb-4 px-4 md:px-8 flex flex-col gap-y-4">
      <DataTable
        data={data.items}
        columns={columns}
        onRowClick={(row) => router.push(`/meetings/${row.id}`)}
      />
      <DataPagination
        page={filters.page}
        totalPages={data.totalPages}
        onPageChange={(page) => setFilters({ page })}
      />
      {data.items.length === 0 && (
        <EmptyState
          title="Create your first meeting"
          description="Schedule a meeting to connect with others. Each meeting lets you collaborate, share ideas, and interact with participants in real time."
        />
      )}
    </div>
  );
};

export const MeetingsViewLoading = () => {
  return <LoadingState title="Loading Meetings" description="This may take a few seconds" />;
};

export const MeetingsViewError = () => {
  return <ErrorState title="Error Loading Meetings" description="Something went wrong" />;
};