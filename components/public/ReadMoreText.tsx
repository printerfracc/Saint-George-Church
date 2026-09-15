"use client";

import { useLayoutEffect, useRef, useState } from "react";

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
  const trimmed = text?.trim() ?? "";
  const textRef = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);

  useLayoutEffect(() => {
    const element = textRef.current;

    if (!element || expanded) {
      return;
    }

    function measure() {
      if (!textRef.current) {
        return;
      }

      setCanExpand(textRef.current.scrollHeight > textRef.current.clientHeight + 2);
    }

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(element);

    return () => observer.disconnect();
  }, [trimmed, expanded, lines]);

  if (!trimmed) {
    return null;
  }

  return (
    <div>
      <p
        ref={textRef}
        style={
          expanded
            ? undefined
            : {
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: lines,
                overflow: "hidden",
              }
        }
        className={className}
      >
        {trimmed}
      </p>
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
