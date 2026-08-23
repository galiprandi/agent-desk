import { describe, it, expect, beforeEach, vi } from "vitest";
import { render } from "@testing-library/react";
import {
  HotkeyManager,
  getHotkeyManager,
  getSequenceManager,
} from "@tanstack/react-hotkeys";
import { db } from "@/lib/db";
import { initAgentAPI, resetCache } from "@/api/agentAPI";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import "@/i18n";

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
  // Reset the singleton managers so registrations from a previous test
  // don't leak in.
  HotkeyManager.resetInstance();
  await freshInit();
});

function Harness() {
  useKeyboardShortcuts();
  return null;
}

describe("useKeyboardShortcuts registration", () => {
  it("registers all 13 shortcuts (7 hotkeys + 6 sequences)", () => {
    render(<Harness />);

    const hm = getHotkeyManager();
    const sm = getSequenceManager();

    const hotkeyCount = hm.registrations.state.size;
    const sequenceCount = sm.registrations.state.size;

    expect(hotkeyCount).toBe(7); // ?, s, x, t, Esc, Mod+E, Mod+I
    expect(sequenceCount).toBe(6); // g d, g t, g c, g s, n t, n e
    expect(hotkeyCount + sequenceCount).toBe(13);
  });

  it("registers the show-shortcuts hotkey with Shift+/", () => {
    render(<Harness />);
    const hm = getHotkeyManager();
    const regs = Array.from(hm.registrations.state.values());
    const show = regs.find((r: any) => r.options.meta?.name === "Show shortcuts");
    expect(show).toBeDefined();
    expect(show!.parsedHotkey.shift).toBe(true);
    expect(show!.parsedHotkey.key).toBe("/");
  });

  it("registers 4 navigation sequences with 2 steps each", () => {
    render(<Harness />);
    const sm = getSequenceManager();
    const regs = Array.from(sm.registrations.state.values());
    const navRegs = regs.filter((r: any) => r.options.meta?.group === "navigation");
    // g d, g t, g c, g s (Esc is a hotkey, not a sequence)
    expect(navRegs.length).toBe(4);
    for (const r of navRegs) {
      expect(r.sequence.length).toBe(2);
    }
  });

  it("registers Mod+E for export backup", () => {
    render(<Harness />);
    const hm = getHotkeyManager();
    const regs = Array.from(hm.registrations.state.values());
    const exportReg = regs.find((r: any) => r.options.meta?.name === "Export backup");
    expect(exportReg).toBeDefined();
    // Mod resolves to Meta on mac, Control on windows/linux. In jsdom the
    // platform is auto-detected; either way one of ctrl/meta must be true.
    const parsed = exportReg!.parsedHotkey;
    expect(parsed.key).toBe("E");
    expect(parsed.ctrl === true || parsed.meta === true).toBe(true);
  });

  it("single-key hotkeys have ignoreInputs: true", () => {
    render(<Harness />);
    const hm = getHotkeyManager();
    const regs = Array.from(hm.registrations.state.values());
    const startSession = regs.find((r: any) => r.options.meta?.name === "Start session");
    expect(startSession).toBeDefined();
    expect(startSession!.options.ignoreInputs).toBe(true);
  });

  it("Mod shortcuts do not force ignoreInputs: true (smart default)", () => {
    render(<Harness />);
    const hm = getHotkeyManager();
    const regs = Array.from(hm.registrations.state.values());
    const exportReg = regs.find((r: any) => r.options.meta?.name === "Export backup");
    expect(exportReg).toBeDefined();
    // Mod+E should NOT have ignoreInputs: true (it uses the smart default)
    expect(exportReg!.options.ignoreInputs).not.toBe(true);
  });

  it("all hotkey registrations carry meta with name, description, and group", () => {
    render(<Harness />);
    const hm = getHotkeyManager();
    const regs = Array.from(hm.registrations.state.values());
    for (const r of regs) {
      expect(r.options.meta?.name).toBeTruthy();
      expect(r.options.meta?.description).toBeTruthy();
      expect(r.options.meta?.group).toBeTruthy();
    }
  });

  it("all sequence registrations carry meta with name, description, and group", () => {
    render(<Harness />);
    const sm = getSequenceManager();
    const regs = Array.from(sm.registrations.state.values());
    for (const r of regs) {
      expect(r.options.meta?.name).toBeTruthy();
      expect(r.options.meta?.description).toBeTruthy();
      expect(r.options.meta?.group).toBeTruthy();
    }
  });
});
