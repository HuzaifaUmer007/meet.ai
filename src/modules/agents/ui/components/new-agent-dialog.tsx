import { useRouter } from "next/navigation";
import { ResponsiveDialog } from "@/components/responsive-dialog";

import { AgentForm } from "./agent-form";

interface NewAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const NewAgentDialog = ({
  open,
  onOpenChange,
}: NewAgentDialogProps) => {
  const router = useRouter();

  return (
    <ResponsiveDialog
      title="New Agent"
      description="Create a new agent"
      open={open}
      onOpenChange={onOpenChange}
    >
      <AgentForm
        onSuccess={() => {
          onOpenChange(false);
          router.refresh();
        }}
        onCancel={() => onOpenChange(false)}
      />
    </ResponsiveDialog>
  );
};
