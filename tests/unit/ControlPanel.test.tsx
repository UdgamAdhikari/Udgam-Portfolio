import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ControlPanel from "@/components/hero/ControlPanel";
import { STORAGE_KEY } from "@/lib/controls-boot";

describe("ControlPanel", () => {
  it("switches the theme on <html> and remembers it", async () => {
    render(<ControlPanel />);
    const toggle = screen.getByRole("switch", { name: "Theme" });
    expect(toggle).toHaveAttribute("aria-checked", "false");

    await userEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-checked", "true");
    expect(document.documentElement.dataset.theme).toBe("graphite");
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}")).toMatchObject({ theme: "graphite" });

    await userEvent.click(toggle);
    expect(document.documentElement.dataset.theme).toBe("paper");
  });

  it("sets the motion level, and calls zero 'Still'", () => {
    render(<ControlPanel />);
    const slider = screen.getByRole("slider", { name: "Motion" });

    fireEvent.change(slider, { target: { value: "40" } });
    expect(document.documentElement.dataset.motion).toBe("0.4");
    expect(document.documentElement.style.getPropertyValue("--motion")).toBe("0.4");

    fireEvent.change(slider, { target: { value: "0" } });
    expect(screen.getByText("Still", { selector: "output" })).toBeInTheDocument();
    expect(slider).toHaveAttribute("aria-valuetext", "Still");
  });
});
