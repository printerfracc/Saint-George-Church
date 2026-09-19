"use client";

import { useLayoutEffect, useRef, useState } from "react";

function normalizePublicMultiline(text?: string | null) {
  return (text ?? "")
    .replace(/\r\n?/g, "\n")
    .replace(/\u2028/g, "\n")
    .replace(/\u2029/g, "\n\n")
    .replace(/[^\S\n]+\n/g, "\n")
    .trim()
    .replace(/\n{3,}/g, "\n\n");
}

const collapsedClampStyle = (lineCount: number) =>
  ({
    display: "-webkit-box",
    overflow: "hidden",
    WebkitBoxOrient: "vertical",
    WebkitLineClamp: lineCount,
  }) as React.CSSProperties;

export default function ReadMoreText({
  text,
  lines = 4,
  className = "",
  buttonClassName = "",
}: {
  text?: string | null;
  lines?: number;
  className?: string;
  buttonClassName?: string;
}) {
  const formatted = normalizePublicMultiline(text);
  const paragraphs = formatted.split(/\n{2,}/).filter(Boolean);
  const collapsedText = paragraphs.join("\n");
  const clampRef = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);

  useLayoutEffect(() => {
    const element = clampRef.current;

    if (!element || expanded) {
      return;
    }

    function measure() {
      if (!clampRef.current) {
        return;
      }

      setCanExpand(clampRef.current.scrollHeight > clampRef.current.clientHeight + 2);
    }

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(element);

    return () => observer.disconnect();
  }, [collapsedText, expanded, lines]);

  if (!formatted) {
    return null;
  }

  return (
    <div>
      <div className={`wrap-break-word ${className}`.trim()}>
        {expanded ? (
          <div className="space-y-3">
            {paragraphs.map((paragraph, index) => (
              <p key={`${index}-${paragraph.slice(0, 24)}`} className="whitespace-pre-line">
                {paragraph}
              </p>
            ))}
          </div>
        ) : (
          <p
            ref={clampRef}
            style={collapsedClampStyle(lines)}
            className="whitespace-pre-line"
          >
            {collapsedText}
          </p>
        )}
      </div>
      {canExpand ? (
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setExpanded((current) => !current);
          }}
          className={`mt-2 inline-flex min-h-11 items-center text-sm font-bold ${buttonClassName}`.trim()}
        >
          {expanded ? "عرض أقل" : "اقرأ المزيد"}
        </button>
      ) : null}
    </div>
  );
}
