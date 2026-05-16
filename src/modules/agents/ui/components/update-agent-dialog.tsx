import { ResponsiveDialog } from "@/components/responsive-dialog";

import { AgentForm } from "./agent-form";
import { type Agent } from "@/app/actions/agents";

interface UpdateAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues: Agent;
};

export const UpdateAgentDialog = ({
  open,
  onOpenChange,
  initialValues
}: UpdateAgentDialogProps) => {
  return (
    <ResponsiveDialog
      title="Edit Agent"
      description="Edit the agent details"
      open={open}
      onOpenChange={onOpenChange}
    >
      <AgentForm
        onSuccess={() => onOpenChange(false)}
        onCancel={() => onOpenChange(false)}
        initialValues={initialValues}
      />
    </ResponsiveDialog>
  );
};
