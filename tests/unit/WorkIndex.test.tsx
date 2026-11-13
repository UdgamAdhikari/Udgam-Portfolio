import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import WorkIndex from "@/components/sections/WorkIndex";
import { projects, TO_CONFIRM } from "@/data/content";

describe("WorkIndex", () => {
  it("links featured projects to their case study and the rest to their code", () => {
    render(<WorkIndex projects={projects} />);
    for (const project of projects) {
      if (project.featured) {
        const links = screen.getAllByRole("link", { name: new RegExp(project.title) });
        expect(links.length).toBeGreaterThan(0);
        for (const link of links) expect(link).toHaveAttribute("href", `/work/${project.slug}`);
        expect(screen.getByRole("link", { name: `Read case study for ${project.title}` })).toBeInTheDocument();
      } else {
        const link = screen.getByRole("link", { name: new RegExp(project.title) });
        expect(link).toHaveAttribute("href", project.liveUrl ?? project.githubUrl);
        expect(link).toHaveAttribute("target", "_blank");
      }
    }
  });

  it("marks unconfirmed stack entries instead of printing the placeholder token", () => {
    render(<WorkIndex projects={projects} />);
    for (const list of screen.getAllByRole("list")) {
      expect(within(list).queryByText("TO_CONFIRM")).not.toBeInTheDocument();
    }
    const unconfirmed = projects.filter((p) => p.technologies.includes(TO_CONFIRM)).length;
    expect(screen.queryAllByText("Stack to confirm")).toHaveLength(unconfirmed);
  });
});
