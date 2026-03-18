"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ActionType } from "@/types/api";
import { Move, Swords, Hand, MessageSquare } from "lucide-react";

const ACTION_TYPES: { type: ActionType; icon: typeof Move; label: string }[] = [
  { type: "move", icon: Move, label: "Move" },
  { type: "attack", icon: Swords, label: "Attack" },
  { type: "interact", icon: Hand, label: "Interact" },
  { type: "free-text", icon: MessageSquare, label: "Free text" },
];

interface ActionToolbarProps {
  onSubmit: (actionType: ActionType, description: string, target?: string) => void;
  disabled?: boolean;
}

export function ActionToolbar({ onSubmit, disabled }: ActionToolbarProps) {
  const [selectedType, setSelectedType] = useState<ActionType>("free-text");
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    if (!description.trim()) return;
    onSubmit(selectedType, description.trim());
    setDescription("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {ACTION_TYPES.map(({ type, icon: Icon, label }) => (
          <Button
            key={type}
            variant={selectedType === type ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedType(type)}
            disabled={disabled}
            aria-label={label}
          >
            <Icon className="mr-1 h-3.5 w-3.5" />
            {label}
          </Button>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe your action..."
          maxLength={500}
          disabled={disabled}
        />
        <Button
          onClick={handleSubmit}
          disabled={disabled || !description.trim()}
        >
          Submit
        </Button>
      </div>
    </div>
  );
}
