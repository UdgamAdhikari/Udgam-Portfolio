import { Children, isValidElement, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import Pending from "@/components/site/Pending";

/**
 * Case-study bodies, written as Markdown in the dashboard. Raw HTML in the
 * source is never rendered (react-markdown escapes it), and links are
 * limited to safe protocols by its default URL transform, so content from
 * the database can't inject script.
 *
 * A paragraph starting with "TO_CONFIRM:" renders as the dashed placeholder,
 * so unconfirmed facts stay visibly unfinished.
 */
const MARKER = /^TO_CONFIRM:\s*/;

function textOf(node: ReactNode): string {
  return Children.toArray(node)
    .map((child) => (typeof child === "string" ? child : isValidElement<{ children?: ReactNode }>(child) ? textOf(child.props.children) : ""))
    .join("");
}

const components: Components = {
  h1: ({ children }) => <h2 className="label mt-14 border-t border-line pt-4 text-muted first:mt-0">{children}</h2>,
  h2: ({ children }) => <h2 className="label mt-14 border-t border-line pt-4 text-muted first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="mt-8 font-display text-2xl font-[620] [font-variation-settings:'wdth'_105]">{children}</h3>,
  p: ({ children }) => {
    const text = textOf(children);
    if (MARKER.test(text)) {
      return (
        <p className="mt-4">
          <Pending>{text.replace(MARKER, "") || "To confirm"}</Pending>
        </p>
      );
    }
    return <p className="mt-4 text-xl leading-snug text-pretty">{children}</p>;
  },
  ul: ({ children }) => <ul className="mt-4 space-y-2 text-xl leading-snug">{children}</ul>,
  ol: ({ children }) => <ol className="mt-4 list-decimal space-y-2 pl-6 text-xl leading-snug">{children}</ol>,
  li: ({ children, node }) =>
    node && (node as { parent?: { tagName?: string } }).parent?.tagName === "ol" ? (
      <li>{children}</li>
    ) : (
      <li className="grid grid-cols-[1.25rem_1fr]">
        <span aria-hidden="true" className="text-muted">
          –
        </span>
        <span>{children}</span>
      </li>
    ),
  a: ({ href, children }) => {
    const external = href ? /^https?:\/\//.test(href) : false;
    return (
      <a
        href={href}
        {...(external ? { target: "_blank", rel: "noreferrer nofollow" } : {})}
        className="underline decoration-line underline-offset-4 hover:decoration-signal"
      >
        {children}
      </a>
    );
  },
  strong: ({ children }) => <strong className="font-medium">{children}</strong>,
  blockquote: ({ children }) => <blockquote className="mt-6 border-l-2 border-signal pl-5 text-muted">{children}</blockquote>,
  code: ({ children }) => <code className="rounded bg-line px-1.5 py-0.5 font-mono text-[0.85em]">{children}</code>,
  pre: ({ children }) => <pre className="mt-6 overflow-x-auto rounded-xl border border-line p-4 font-mono text-sm">{children}</pre>,
  // Images in the body would bypass upload validation and layout sizing; use the gallery instead.
  img: () => null,
  hr: () => <hr className="mt-10 border-line" />,
};

export default function Markdown({ children }: { children: string }) {
  return <ReactMarkdown components={components} skipHtml>{children}</ReactMarkdown>;
}
