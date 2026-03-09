"use client";

import { useState } from "react";
import { Pencil, Check, X } from "lucide-react";

interface WeightBarProps {
  currentWeight: number;
  maxCapacity: number;
  isEditable?: boolean;
  onMaxCapacityChange?: (newMaxCapacity: number) => void;
}

export function WeightBar({
  currentWeight,
  maxCapacity,
  isEditable = false,
  onMaxCapacityChange,
}: WeightBarProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");

  const isOverencumbered = currentWeight > maxCapacity;
  const percentage = maxCapacity > 0 ? Math.min((currentWeight / maxCapacity) * 100, 100) : 0;

  const barColor = isOverencumbered
    ? "bg-danger"
    : "bg-accent-primary";

  const handleStartEdit = () => {
    setEditValue(String(maxCapacity));
    setIsEditing(true);
  };

  const handleConfirm = () => {
    const parsed = parseFloat(editValue);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 9999) {
      onMaxCapacityChange?.(parsed);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-medium text-text-secondary">Weight</h3>
        <div className="flex items-center gap-1">
          {isEditing ? (
            <>
              <span
                className={`text-sm font-medium ${
                  isOverencumbered ? "text-danger" : "text-text-primary"
                }`}
              >
                {currentWeight.toFixed(1)}/
              </span>
              <input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleConfirm();
                  if (e.key === "Escape") handleCancel();
                }}
                className="w-16 rounded border border-border bg-surface-primary px-1 text-sm font-medium text-text-primary text-right"
                min={0}
                max={9999}
                step={0.1}
                autoFocus
                aria-label="Max capacity"
              />
              <span className="text-sm font-medium text-text-primary"> kg</span>
              <button
                type="button"
                onClick={handleConfirm}
                className="ml-1 text-success hover:text-success/80"
                aria-label="Confirm max capacity"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="text-danger hover:text-danger/80"
                aria-label="Cancel editing"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <>
              <span
                className={`text-sm font-medium ${
                  isOverencumbered ? "text-danger" : "text-text-primary"
                }`}
              >
                {currentWeight.toFixed(1)}/{maxCapacity.toFixed(1)} kg
              </span>
              {isEditable && onMaxCapacityChange && (
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="ml-1 text-text-muted hover:text-text-primary transition-colors"
                  aria-label="Edit max capacity"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
      <div
        className="h-3 w-full rounded-full bg-surface-interactive overflow-hidden"
        role="progressbar"
        aria-valuenow={currentWeight}
        aria-valuemin={0}
        aria-valuemax={maxCapacity}
        aria-label={`Weight: ${currentWeight} of ${maxCapacity} kg${isOverencumbered ? " (overencumbered)" : ""}`}
      >
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {isOverencumbered && (
        <p className="mt-1 text-xs text-danger" role="alert">
          Overencumbered! Your character is carrying too much weight.
        </p>
      )}
    </div>
  );
}
