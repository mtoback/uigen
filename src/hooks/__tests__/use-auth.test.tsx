import { test, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
import { useAuth } from "@/hooks/use-auth";
import { signIn as signInAction, signUp as signUpAction } from "@/actions";
import { createProject } from "@/actions/create-project";
import { getProjects } from "@/actions/get-projects";
import { getAnonWorkData, clearAnonWork } from "@/lib/anon-work-tracker";
import { useRouter } from "next/navigation";

// Mock dependencies
vi.mock("@/actions", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("@/actions/create-project", () => ({
  createProject: vi.fn(),
}));

vi.mock("@/actions/get-projects", () => ({
  getProjects: vi.fn(),
}));

vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: vi.fn(),
  clearAnonWork: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

let mockRouter: { push: vi.Mock };

beforeEach(() => {
  vi.clearAllMocks();
  mockRouter = { push: vi.fn() };
  (useRouter as any).mockReturnValue(mockRouter);
});

afterEach(() => {
  cleanup();
});

test("signIn returns result and calls signInAction", async () => {
  (signInAction as any).mockResolvedValue({ success: true });
  (getAnonWorkData as any).mockReturnValue(null);
  (getProjects as any).mockResolvedValue([{ id: "project1" }]);

  const { result } = renderHook(() => useAuth());

  let signInResult;
  await act(async () => {
    signInResult = await result.current.signIn(
      "test@example.com",
      "password"
    );
  });

  expect(signInResult).toEqual({ success: true });
  expect(signInAction).toHaveBeenCalledWith("test@example.com", "password");
});

test("signIn sets loading state to false after completion", async () => {
  (signInAction as any).mockResolvedValue({ success: true });
  (getAnonWorkData as any).mockReturnValue(null);
  (getProjects as any).mockResolvedValue([{ id: "project1" }]);

  const { result } = renderHook(() => useAuth());

  expect(result.current.isLoading).toBe(false);

  await act(async () => {
    await result.current.signIn("test@example.com", "password");
  });

  expect(result.current.isLoading).toBe(false);
});

test("signIn navigates to existing project when available", async () => {
  (signInAction as any).mockResolvedValue({ success: true });
  (getAnonWorkData as any).mockReturnValue(null);
  (getProjects as any).mockResolvedValue([{ id: "existingProject" }]);

  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await result.current.signIn("test@example.com", "password");
  });

  expect(mockRouter.push).toHaveBeenCalledWith("/existingProject");
});

test("signIn creates new project when no projects exist", async () => {
  (signInAction as any).mockResolvedValue({ success: true });
  (getAnonWorkData as any).mockReturnValue(null);
  (getProjects as any).mockResolvedValue([]);
  (createProject as any).mockResolvedValue({ id: "newProject" });

  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await result.current.signIn("test@example.com", "password");
  });

  expect(createProject).toHaveBeenCalled();
  expect(mockRouter.push).toHaveBeenCalledWith("/newProject");
});

test("signIn handles anonymous work and creates project from it", async () => {
  (signInAction as any).mockResolvedValue({ success: true });
  (getAnonWorkData as any).mockReturnValue({
    messages: [{ role: "user", content: "Hello" }],
    fileSystemData: { "/App.jsx": "export default App" },
  });
  (createProject as any).mockResolvedValue({ id: "anonProject" });

  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await result.current.signIn("test@example.com", "password");
  });

  expect(getAnonWorkData).toHaveBeenCalled();
  expect(createProject).toHaveBeenCalledWith(
    expect.objectContaining({
      messages: expect.any(Array),
      data: expect.any(Object),
    })
  );
  expect(clearAnonWork).toHaveBeenCalled();
  expect(mockRouter.push).toHaveBeenCalledWith("/anonProject");
});

test("signIn does not navigate on failed authentication", async () => {
  (signInAction as any).mockResolvedValue({
    success: false,
    error: "Invalid credentials",
  });

  const { result } = renderHook(() => useAuth());

  let signInResult;
  await act(async () => {
    signInResult = await result.current.signIn(
      "test@example.com",
      "wrongpassword"
    );
  });

  expect(signInResult.success).toBe(false);
  expect(mockRouter.push).not.toHaveBeenCalled();
});

test("signIn resets loading state even on exception", async () => {
  (signInAction as any).mockRejectedValue(new Error("Network error"));

  const { result } = renderHook(() => useAuth());

  try {
    await act(async () => {
      await result.current.signIn("test@example.com", "password");
    });
  } catch {
    // Exception is expected
  }

  expect(result.current.isLoading).toBe(false);
});

test("signUp returns result and calls signUpAction", async () => {
  (signUpAction as any).mockResolvedValue({ success: true });
  (getAnonWorkData as any).mockReturnValue(null);
  (getProjects as any).mockResolvedValue([]);
  (createProject as any).mockResolvedValue({ id: "newProject" });

  const { result } = renderHook(() => useAuth());

  let signUpResult;
  await act(async () => {
    signUpResult = await result.current.signUp(
      "newuser@example.com",
      "password"
    );
  });

  expect(signUpResult).toEqual({ success: true });
  expect(signUpAction).toHaveBeenCalledWith("newuser@example.com", "password");
});

test("signUp sets loading state to false after completion", async () => {
  (signUpAction as any).mockResolvedValue({ success: true });
  (getAnonWorkData as any).mockReturnValue(null);
  (getProjects as any).mockResolvedValue([]);
  (createProject as any).mockResolvedValue({ id: "newProject" });

  const { result } = renderHook(() => useAuth());

  expect(result.current.isLoading).toBe(false);

  await act(async () => {
    await result.current.signUp("newuser@example.com", "password");
  });

  expect(result.current.isLoading).toBe(false);
});

test("signUp does not navigate on failed registration", async () => {
  (signUpAction as any).mockResolvedValue({
    success: false,
    error: "Email already exists",
  });

  const { result } = renderHook(() => useAuth());

  let signUpResult;
  await act(async () => {
    signUpResult = await result.current.signUp(
      "existing@example.com",
      "password"
    );
  });

  expect(signUpResult.success).toBe(false);
  expect(mockRouter.push).not.toHaveBeenCalled();
});

test("signUp resets loading state even on exception", async () => {
  (signUpAction as any).mockRejectedValue(new Error("Server error"));

  const { result } = renderHook(() => useAuth());

  try {
    await act(async () => {
      await result.current.signUp("newuser@example.com", "password");
    });
  } catch {
    // Exception is expected
  }

  expect(result.current.isLoading).toBe(false);
});

test("hook returns correct public interface", () => {
  (signInAction as any).mockResolvedValue({ success: true });
  (getProjects as any).mockResolvedValue([]);

  const { result } = renderHook(() => useAuth());

  expect(typeof result.current.signIn).toBe("function");
  expect(typeof result.current.signUp).toBe("function");
  expect(typeof result.current.isLoading).toBe("boolean");
  expect(result.current.isLoading).toBe(false);
});

test("signIn clears anonymous work after creating project", async () => {
  (signInAction as any).mockResolvedValue({ success: true });
  (getAnonWorkData as any).mockReturnValue({
    messages: [{ role: "user", content: "Test" }],
    fileSystemData: {},
  });
  (createProject as any).mockResolvedValue({ id: "project123" });

  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await result.current.signIn("user@example.com", "password");
  });

  expect(clearAnonWork).toHaveBeenCalled();
});

test("signIn generates new project name with timestamp when no projects exist", async () => {
  (signInAction as any).mockResolvedValue({ success: true });
  (getAnonWorkData as any).mockReturnValue(null);
  (getProjects as any).mockResolvedValue([]);
  (createProject as any).mockResolvedValue({ id: "project456" });

  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await result.current.signIn("user@example.com", "password");
  });

  expect(createProject).toHaveBeenCalledWith(
    expect.objectContaining({
      name: expect.stringMatching(/^New Design #\d+$/),
      messages: [],
      data: expect.any(Object),
    })
  );
});

test("signIn creates named project from anonymous work with timestamp", async () => {
  (signInAction as any).mockResolvedValue({ success: true });
  (getAnonWorkData as any).mockReturnValue({
    messages: [{ role: "user", content: "Create button" }],
    fileSystemData: { "/App.jsx": "code" },
  });
  (createProject as any).mockResolvedValue({ id: "anonProject789" });

  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await result.current.signIn("user@example.com", "password");
  });

  expect(createProject).toHaveBeenCalledWith(
    expect.objectContaining({
      name: expect.stringMatching(/^Design from /),
      messages: [{ role: "user", content: "Create button" }],
      data: { "/App.jsx": "code" },
    })
  );
});
