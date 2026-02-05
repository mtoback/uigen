"use client";

import { ToolInvocation } from "ai";
import { Loader2 } from "lucide-react";

interface ToolCallBadgeProps {
  toolInvocation: ToolInvocation;
}

/**
 * Get the user-friendly message for a tool invocation
 */
function getToolMessage(toolInvocation: ToolInvocation): string {
  const { toolName } = toolInvocation;
  const args = toolInvocation.args as Record<string, any> || {};

  const path = args?.path as string;
  const filename = getBasename(path);

  if (toolName === "str_replace_editor") {
    const command = args?.command as string;

    switch (command) {
      case "create":
        return `Creating ${filename}`;
      case "str_replace":
        return `Editing ${filename}`;
      case "insert":
        return `Editing ${filename}`;
      case "view":
        return `Viewing ${filename}`;
      case "undo_edit":
        return `Undoing changes to ${filename}`;
      default:
        return `Modifying ${filename}`;
    }
  }

  if (toolName === "file_manager") {
    const command = args?.command as string;

    switch (command) {
      case "rename": {
        const newPath = args?.new_path as string;
        const newFilename = getBasename(newPath);
        return `Renaming ${filename} to ${newFilename}`;
      }
      case "delete":
        return `Deleting ${filename}`;
      default:
        return `Managing ${filename}`;
    }
  }

  return toolName;
}

/**
 * Extract the filename (basename) from a full path
 */
function getBasename(path: string | undefined): string {
  if (!path) return "file";
  const parts = path.split("/").filter(Boolean);
  return parts[parts.length - 1] || path;
}

export function ToolCallBadge({ toolInvocation }: ToolCallBadgeProps) {
  const message = getToolMessage(toolInvocation);
  const isComplete = toolInvocation.state === "result" && toolInvocation.result;

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isComplete ? (
        <>
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span className="text-neutral-700">{message}</span>
        </>
      ) : (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
          <span className="text-neutral-700">{message}</span>
        </>
      )}
    </div>
  );
}
