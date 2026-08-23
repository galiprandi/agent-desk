import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { db } from "@/lib/db";
import { initAgentAPI, resetCache } from "@/api/agentAPI";
import { ShortcutsView } from "@/views/ShortcutsView";
import "@/i18n";

// Mock TanStack Router's useNavigate so useKeyboardShortcuts doesn't crash
// if it gets imported transitively.
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
  useRouterState: () => ({ location: { pathname: "/" } }),
}));

async function freshInit() {
  await Promise.all([
    db.tasks.clear(),
    db.events.clear(),
    db.sessions.clear(),
    db.links.clear(),
    db.config.clear(),
  ]);
  resetCache();
  await initAgentAPI();
}

beforeEach(async () => {
  await freshInit();
});

describe("ShortcutsView integration", () => {
  it("renders the title and description", () => {
    render(<ShortcutsView />);
    expect(screen.getByTestId("shortcuts-title")).toBeTruthy();
    expect(screen.getByTestId("shortcuts-description")).toBeTruthy();
  });

  it("renders all 5 group sections", () => {
    render(<ShortcutsView />);
    expect(screen.getByTestId("shortcuts-group-navigation")).toBeTruthy();
    expect(screen.getByTestId("shortcuts-group-actions")).toBeTruthy();
    expect(screen.getByTestId("shortcuts-group-session")).toBeTruthy();
    expect(screen.getByTestId("shortcuts-group-ui")).toBeTruthy();
    expect(screen.getByTestId("shortcuts-group-data")).toBeTruthy();
  });

  it("renders a row for each of the 13 shortcuts", () => {
    render(<ShortcutsView />);
    const rows = screen.getAllByTestId(/^shortcut-row-/);
    expect(rows.length).toBe(13);
  });

  it("renders the go-dashboard row with translated name", () => {
    render(<ShortcutsView />);
    const row = screen.getByTestId("shortcut-row-go-dashboard");
    expect(row.textContent).toContain("Go to Dashboard");
  });

  it("renders the show-shortcuts row with translated name", () => {
    render(<ShortcutsView />);
    const row = screen.getByTestId("shortcut-row-show-shortcuts");
    expect(row.textContent).toContain("Show shortcuts");
  });

  it("renders the export-backup row with translated name", () => {
    render(<ShortcutsView />);
    const row = screen.getByTestId("shortcut-row-export-backup");
    expect(row.textContent).toContain("Export backup");
  });

  it("shows a registered count with a number", () => {
    render(<ShortcutsView />);
    const count = screen.getByTestId("shortcuts-count");
    // i18n interpolates {{count}} — the rendered text should contain a digit
    expect(count.textContent).toMatch(/\d+/);
  });

  it("renders kbd elements for the key displays", () => {
    render(<ShortcutsView />);
    const kbds = screen.getAllByTestId("kbd");
    expect(kbds.length).toBeGreaterThan(0);
  });
});
