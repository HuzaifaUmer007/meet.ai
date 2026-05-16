"use client";

import { ResponsiveDialog } from "@/components/responsive-dialog";
import { CompanyAgentForm } from "./company-agent-form";

interface NewCompanyAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NewCompanyAgentDialog = ({
  open,
  onOpenChange,
}: NewCompanyAgentDialogProps) => {
  return (
    <ResponsiveDialog
      title="Create Company Agent"
      description="Fill in your business details to create a specialized AI assistant."
      open={open}
      onOpenChange={onOpenChange}
    >
      <CompanyAgentForm
        onSuccess={() => onOpenChange(false)}
        onCancel={() => onOpenChange(false)}
      />
    </ResponsiveDialog>
  );
};
