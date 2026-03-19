"use client";

import { usePipelineMode } from "@/hooks/use-pipeline-mode";
import { useTogglePipelineMode } from "@/hooks/use-toggle-pipeline-mode";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Lock, Unlock } from "lucide-react";

interface PipelineModeToggleProps {
  campaignId: string;
  sessionId: string;
}

export function PipelineModeToggle({
  campaignId,
  sessionId,
}: PipelineModeToggleProps) {
  const { pipelineMode } = usePipelineMode(campaignId, sessionId);
  const togglePipelineMode = useTogglePipelineMode();

  const isMandatory = pipelineMode === "mandatory";

  const handleToggle = () => {
    togglePipelineMode.mutate({
      campaignId,
      sessionId,
      pipelineMode: isMandatory ? "optional" : "mandatory",
    });
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isMandatory ? "default" : "outline"}
            size="sm"
            onClick={handleToggle}
            disabled={togglePipelineMode.isPending}
            aria-label="Toggle mandatory pipeline mode"
            className={
              isMandatory
                ? "bg-emerald-600 hover:bg-emerald-700 text-white transition-opacity duration-300 motion-reduce:transition-none"
                : "transition-opacity duration-300 motion-reduce:transition-none"
            }
          >
            {isMandatory ? (
              <Lock className="mr-1.5 h-3.5 w-3.5" />
            ) : (
              <Unlock className="mr-1.5 h-3.5 w-3.5" />
            )}
            {isMandatory ? "Mandatory Pipeline" : "Free Pipeline"}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {isMandatory
              ? "Pipeline is mandatory: players can only submit actions when pinged. Click to switch to free mode."
              : "Pipeline is free: players can submit actions at any time. Click to switch to mandatory mode."}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
