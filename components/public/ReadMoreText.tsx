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
  const formatted = (text ?? "").replace(/\r\n/g, "\n").trim();
  const textRef = useRef<HTMLDivElement>(null);
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
  }, [formatted, expanded, lines]);

  if (!formatted) {
    return null;
  }

  return (
    <div>
      <div
        ref={textRef}
        style={
          expanded
            ? undefined
            : {
                maxHeight: `calc(${lines} * 1lh)`,
                overflow: "hidden",
              }
        }
        className={`whitespace-pre-line wrap-break-word ${className}`.trim()}
      >
        {formatted}
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
