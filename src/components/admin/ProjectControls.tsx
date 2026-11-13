"use client";

import { deleteProjectAction, featureProject, moveProjectAction, publishProject } from "@/app/admin/_actions/projects";
import ActionButton from "./ActionButton";
import { buttonClass, primaryButtonClass, quietButtonClass } from "./ui";

export function MoveButtons({ id, title, first, last }: { id: string; title: string; first: boolean; last: boolean }) {
  return (
    <span className="flex gap-1">
      {!first && (
        <ActionButton action={() => moveProjectAction(id, -1)} className={quietButtonClass} label={`Move ${title} up`}>
          ↑
        </ActionButton>
      )}
      {!last && (
        <ActionButton action={() => moveProjectAction(id, 1)} className={quietButtonClass} label={`Move ${title} down`}>
          ↓
        </ActionButton>
      )}
    </span>
  );
}

export function PublishToggle({ id, published, title }: { id: string; published: boolean; title?: string }) {
  return (
    <ActionButton
      action={() => publishProject(id, !published)}
      className={published ? buttonClass : primaryButtonClass}
      label={title ? `${published ? "Unpublish" : "Publish"} ${title}` : undefined}
    >
      {published ? "Unpublish" : "Publish"}
    </ActionButton>
  );
}

export function FeatureToggle({ id, featured }: { id: string; featured: boolean }) {
  return (
    <ActionButton action={() => featureProject(id, !featured)} pressed={featured}>
      {featured ? "Featured (case study)" : "Not featured"}
    </ActionButton>
  );
}

export function DeleteProject({ id }: { id: string }) {
  return (
    <ActionButton action={() => deleteProjectAction(id)} confirm="Press again to delete">
      Delete project
    </ActionButton>
  );
}
