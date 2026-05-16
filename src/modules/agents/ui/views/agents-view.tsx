"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { DataTable } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { DataPagination } from "@/components/data-pagination";
import { getAgents, type Agent } from "@/app/actions/agents";

import { columns } from "../components/columns";
import { useAgentsFilters } from "../../hooks/use-agents-filters";

export const AgentsView = ({ 
  initialData, 
  initialFilters 
}: { 
  initialData: { items: Agent[]; totalPages: number };
  initialFilters: any;
}) => {
  const router = useRouter();
  const [filters, setFilters] = useAgentsFilters();
  const [data, setData] = useState<{ items: Agent[]; totalPages: number }>(initialData);
  const [isPending, startTransition] = useTransition();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Update local state when server data changes (router.refresh())
  useEffect(() => {
    if (isMounted) {
      setData(initialData);
    }
  }, [initialData, isMounted]);

  // Handle agent-deleted event for auto-refresh
  useEffect(() => {
    if (!isMounted) return;

    const refreshData = async () => {
      startTransition(async () => {
        const result = await getAgents(filters);
        setData(result);
      });
    };

    window.addEventListener("agent-deleted", refreshData);
    return () => window.removeEventListener("agent-deleted", refreshData);
  }, [filters, isMounted]);

  // Handle client-side filter changes
  useEffect(() => {
    if (isMounted && JSON.stringify(filters) !== JSON.stringify(initialFilters)) {
      startTransition(async () => {
        const result = await getAgents(filters);
        setData(result);
      });
    }
  }, [filters, initialFilters, isMounted]);

  if (isPending && !data) {
    return (
      <LoadingState title="Loading Agents" description="This may take a few seconds" />
    );
  }

  if (!data) return null;

  return (
    <div className="flex-1 pb-4 px-4 md:px-8 flex flex-col gap-y-4">
      <DataTable
        data={data.items}
        columns={columns}
        onRowClick={(row) => router.push(`/agents/${row.id}`)}
      />
      <DataPagination
        page={filters.page}
        totalPages={data.totalPages}
        onPageChange={(page) => setFilters({ page })}
      />
      {data.items.length === 0 && (
        <EmptyState
          title="Create your first agent"
          description="Create an agent to join your meetings. Each agent will follow your instructions and can interact with participants during the call."
        />
      )}
    </div>
  );
};

export const AgentsViewLoading = () => {
  return (
    <LoadingState title="Loading Agents" description="This may take a few seconds" />
  );
};

export const AgentsViewError = () => {
  return (
    <ErrorState title="Error Loading Agents" description="Something went wrong" />
  );
};