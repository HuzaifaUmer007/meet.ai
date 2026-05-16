import type { SearchParams } from "nuqs";

import { loadSearchParams } from "@/modules/agents/params";
import { AgentsListHeader } from "@/modules/agents/ui/components/agents-list-header";
import { AgentsView, AgentsViewError, AgentsViewLoading } from "@/modules/agents/ui/views/agents-view";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { getAgents } from "@/app/actions/agents";

interface Props {
  searchParams: Promise<SearchParams>;
}

const Page = async ({ searchParams }: Props) => {
  const filters = await loadSearchParams(searchParams);
  const data = await getAgents(filters);

  return (
    <>
      <AgentsListHeader />
      <Suspense fallback={<AgentsViewLoading />}>
        <ErrorBoundary fallback={<AgentsViewError />}>
          <AgentsView initialData={data} initialFilters={filters} />
        </ErrorBoundary>
      </Suspense>
    </>
  );
};

export default Page;
