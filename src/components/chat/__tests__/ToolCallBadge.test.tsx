import { test, expect, afterEach, describe } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolInvocation } from "ai";
import { ToolCallBadge } from "../ToolCallBadge";

afterEach(() => {
  cleanup();
});

// Helper function to create a mock ToolInvocation
function createToolInvocation(
  toolName: string,
  args: Record<string, any>,
  state: "partial-call" | "call" | "result" = "call",
  result?: any
): ToolInvocation {
  return {
    toolName,
    toolCallId: "test-id",
    args,
    state,
    result,
  } as ToolInvocation;
}

describe("ToolCallBadge - str_replace_editor", () => {
  test("renders 'Creating' message for create command", () => {
    const tool = createToolInvocation("str_replace_editor", {
      command: "create",
      path: "/App.jsx",
    });
    render(<ToolCallBadge toolInvocation={tool} />);
    expect(screen.getByText("Creating App.jsx")).toBeDefined();
  });

  test("renders 'Editing' message for str_replace command", () => {
    const tool = createToolInvocation("str_replace_editor", {
      command: "str_replace",
      path: "/components/Card.tsx",
    });
    render(<ToolCallBadge toolInvocation={tool} />);
    expect(screen.getByText("Editing Card.tsx")).toBeDefined();
  });

  test("renders 'Editing' message for insert command", () => {
    const tool = createToolInvocation("str_replace_editor", {
      command: "insert",
      path: "/styles.css",
    });
    render(<ToolCallBadge toolInvocation={tool} />);
    expect(screen.getByText("Editing styles.css")).toBeDefined();
  });

  test("renders 'Viewing' message for view command", () => {
    const tool = createToolInvocation("str_replace_editor", {
      command: "view",
      path: "/components/Button.jsx",
    });
    render(<ToolCallBadge toolInvocation={tool} />);
    expect(screen.getByText("Viewing Button.jsx")).toBeDefined();
  });

  test("renders 'Undoing changes' message for undo_edit command", () => {
    const tool = createToolInvocation("str_replace_editor", {
      command: "undo_edit",
      path: "/index.ts",
    });
    render(<ToolCallBadge toolInvocation={tool} />);
    expect(screen.getByText("Undoing changes to index.ts")).toBeDefined();
  });

  test("extracts filename from nested path", () => {
    const tool = createToolInvocation("str_replace_editor", {
      command: "create",
      path: "/src/components/ui/Button.tsx",
    });
    render(<ToolCallBadge toolInvocation={tool} />);
    expect(screen.getByText("Creating Button.tsx")).toBeDefined();
  });

  test("handles missing path gracefully", () => {
    const tool = createToolInvocation("str_replace_editor", {
      command: "create",
      path: undefined,
    });
    render(<ToolCallBadge toolInvocation={tool} />);
    expect(screen.getByText("Creating file")).toBeDefined();
  });

  test("handles unknown command for str_replace_editor", () => {
    const tool = createToolInvocation("str_replace_editor", {
      command: "unknown",
      path: "/test.js",
    });
    render(<ToolCallBadge toolInvocation={tool} />);
    expect(screen.getByText("Modifying test.js")).toBeDefined();
  });
});

describe("ToolCallBadge - file_manager", () => {
  test("renders 'Renaming' message with both old and new filenames", () => {
    const tool = createToolInvocation(
      "file_manager",
      {
        command: "rename",
        path: "/OldName.tsx",
        new_path: "/NewName.tsx",
      }
    );
    render(<ToolCallBadge toolInvocation={tool} />);
    expect(screen.getByText("Renaming OldName.tsx to NewName.tsx")).toBeDefined();
  });

  test("renders 'Deleting' message for delete command", () => {
    const tool = createToolInvocation("file_manager", {
      command: "delete",
      path: "/components/Unused.jsx",
    });
    render(<ToolCallBadge toolInvocation={tool} />);
    expect(screen.getByText("Deleting Unused.jsx")).toBeDefined();
  });

  test("extracts filename from nested path for rename", () => {
    const tool = createToolInvocation("file_manager", {
      command: "rename",
      path: "/src/components/old/Component.tsx",
      new_path: "/src/components/new/Component.tsx",
    });
    render(<ToolCallBadge toolInvocation={tool} />);
    expect(screen.getByText("Renaming Component.tsx to Component.tsx")).toBeDefined();
  });

  test("handles missing new_path for rename", () => {
    const tool = createToolInvocation("file_manager", {
      command: "rename",
      path: "/file.js",
      new_path: undefined,
    });
    render(<ToolCallBadge toolInvocation={tool} />);
    expect(screen.getByText("Renaming file.js to file")).toBeDefined();
  });

  test("handles unknown command for file_manager", () => {
    const tool = createToolInvocation("file_manager", {
      command: "unknown",
      path: "/test.js",
    });
    render(<ToolCallBadge toolInvocation={tool} />);
    expect(screen.getByText("Managing test.js")).toBeDefined();
  });
});

describe("ToolCallBadge - visual states", () => {
  test("shows loading spinner when state is 'call'", () => {
    const tool = createToolInvocation(
      "str_replace_editor",
      {
        command: "create",
        path: "/App.jsx",
      },
      "call"
    );
    const { container } = render(<ToolCallBadge toolInvocation={tool} />);
    const spinner = container.querySelector("svg.animate-spin");
    expect(spinner).toBeDefined();
  });

  test("shows green dot when state is 'result' with result data", () => {
    const tool = createToolInvocation(
      "str_replace_editor",
      {
        command: "create",
        path: "/App.jsx",
      },
      "result",
      { success: true, message: "File created" }
    );
    const { container } = render(<ToolCallBadge toolInvocation={tool} />);
    const greenDot = container.querySelector(".bg-emerald-500");
    expect(greenDot).toBeDefined();
  });

  test("shows loading spinner when state is 'partial-call'", () => {
    const tool = createToolInvocation(
      "str_replace_editor",
      {
        command: "create",
        path: "/App.jsx",
      },
      "partial-call"
    );
    const { container } = render(<ToolCallBadge toolInvocation={tool} />);
    const spinner = container.querySelector("svg.animate-spin");
    expect(spinner).toBeDefined();
  });

  test("shows loading state when result is missing", () => {
    const tool = createToolInvocation(
      "str_replace_editor",
      {
        command: "create",
        path: "/App.jsx",
      },
      "result",
      undefined
    );
    const { container } = render(<ToolCallBadge toolInvocation={tool} />);
    const spinner = container.querySelector("svg.animate-spin");
    expect(spinner).toBeDefined();
  });
});

describe("ToolCallBadge - edge cases", () => {
  test("handles missing args", () => {
    const tool = {
      toolName: "str_replace_editor",
      toolCallId: "test-id",
      args: undefined,
      state: "call",
    } as unknown as ToolInvocation;
    const { container } = render(<ToolCallBadge toolInvocation={tool} />);
    expect(container.textContent).toContain("Modifying file");
  });

  test("handles empty args", () => {
    const tool = createToolInvocation("str_replace_editor", {});
    const { container } = render(<ToolCallBadge toolInvocation={tool} />);
    expect(container.textContent).toContain("Modifying file");
  });

  test("handles unknown tool name", () => {
    const tool = createToolInvocation("unknown_tool", {
      command: "do_something",
      path: "/file.js",
    });
    render(<ToolCallBadge toolInvocation={tool} />);
    expect(screen.getByText("unknown_tool")).toBeDefined();
  });

  test("handles path with trailing slash", () => {
    const tool = createToolInvocation("str_replace_editor", {
      command: "create",
      path: "/src/",
    });
    render(<ToolCallBadge toolInvocation={tool} />);
    // Should display "Creating src" not "Creating /"
    expect(screen.getByText("Creating src")).toBeDefined();
  });

  test("handles path with multiple trailing slashes", () => {
    const tool = createToolInvocation("str_replace_editor", {
      command: "create",
      path: "/components///",
    });
    render(<ToolCallBadge toolInvocation={tool} />);
    expect(screen.getByText("Creating components")).toBeDefined();
  });

  test("handles single file name without path", () => {
    const tool = createToolInvocation("str_replace_editor", {
      command: "create",
      path: "App.jsx",
    });
    render(<ToolCallBadge toolInvocation={tool} />);
    expect(screen.getByText("Creating App.jsx")).toBeDefined();
  });
});

describe("ToolCallBadge - styling", () => {
  test("has correct badge styling classes", () => {
    const tool = createToolInvocation("str_replace_editor", {
      command: "create",
      path: "/App.jsx",
    });
    const { container } = render(<ToolCallBadge toolInvocation={tool} />);
    const badge = container.firstChild as HTMLElement;

    expect(badge.className).toContain("inline-flex");
    expect(badge.className).toContain("items-center");
    expect(badge.className).toContain("gap-2");
    expect(badge.className).toContain("mt-2");
    expect(badge.className).toContain("px-3");
    expect(badge.className).toContain("py-1.5");
    expect(badge.className).toContain("bg-neutral-50");
    expect(badge.className).toContain("rounded-lg");
    expect(badge.className).toContain("text-xs");
    expect(badge.className).toContain("font-mono");
    expect(badge.className).toContain("border");
    expect(badge.className).toContain("border-neutral-200");
  });

  test("text has correct color classes", () => {
    const tool = createToolInvocation("str_replace_editor", {
      command: "create",
      path: "/App.jsx",
    });
    const { container } = render(<ToolCallBadge toolInvocation={tool} />);
    const text = screen.getByText("Creating App.jsx");
    expect(text.className).toContain("text-neutral-700");
  });

  test("spinner has correct color classes when loading", () => {
    const tool = createToolInvocation(
      "str_replace_editor",
      {
        command: "create",
        path: "/App.jsx",
      },
      "call"
    );
    const { container } = render(<ToolCallBadge toolInvocation={tool} />);
    const spinner = container.querySelector("svg");
    expect(spinner).toBeDefined();
    const className = spinner?.className.baseVal || spinner?.className || "";
    expect(String(className)).toMatch(/animate-spin/);
    expect(String(className)).toMatch(/text-blue-600/);
  });
});
