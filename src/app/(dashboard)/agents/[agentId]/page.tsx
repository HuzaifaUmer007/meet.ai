import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import {
  AgentIdView,
  AgentIdViewError,
  AgentIdViewLoading,
} from "@/modules/agents/ui/views/agent-id-view";

interface Props {
  params: Promise<{ agentId: string }>;
}

const Page = async ({ params }: Props) => {
  const { agentId } = await params;

  return (
    <Suspense fallback={<AgentIdViewLoading />}>
      <ErrorBoundary fallback={<AgentIdViewError />}>
        <AgentIdView agentId={agentId} />
      </ErrorBoundary>
    </Suspense>
  );
};

export default Page;
