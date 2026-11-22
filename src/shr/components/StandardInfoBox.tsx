/**
 * StandardInfoBox.tsx — نمایش یکپارچه اطلاعات و منبع استاندارد متصل
 */
import type { ReactNode } from "react";
import { toFa } from "../utils/fa";

interface Props {
  title?: string;
  source?: string;
  publishYear?: number | string;
  badge?: string;
  variant?: "box" | "inline";
  children?: ReactNode;
}

export default function StandardInfoBox({
  title,
  source,
  publishYear,
  badge,
  variant = "box",
  children,
}: Props) {
  const yearText = publishYear != null && publishYear !== "" ? toFa(publishYear) : "";
  const sourceLine = [source, yearText].filter(Boolean).join(" • ");

  if (variant === "inline") {
    if (!sourceLine) return null;
    return (
      <div
        style={{
          fontSize: "var(--fs-2xs)",
          color: "var(--muted)",
          fontWeight: 600,
          paddingTop: 2,
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        <span>📚</span>
        <span>{sourceLine}</span>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "var(--pad-normal)",
        background: "var(--accent-soft)",
        border: "1px solid var(--accent-border)",
        borderRadius: "var(--r-sm)",
        fontSize: "var(--fs-xs)",
        color: "var(--muted)",
        lineHeight: 1.5,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {title && (
            <div
              style={{
                fontWeight: 700,
                color: "var(--accent)",
                fontSize: "var(--fs-sm)",
                marginBottom: sourceLine || children ? 2 : 0,
              }}
            >
              📚 {title}
            </div>
          )}
          {sourceLine && (
            <div
              style={{
                fontSize: "var(--fs-2xs)",
                fontWeight: 600,
                color: "var(--muted)",
                opacity: 0.9,
                marginBottom: children ? 4 : 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {!title ? "📚 " : ""}{sourceLine}
            </div>
          )}
        </div>
        {badge && (
          <div
            style={{
              fontSize: "var(--fs-2xs)",
              fontWeight: 800,
              padding: "var(--pad-chip-xs)",
              borderRadius: "var(--r-sm)",
              background: "var(--accent)",
              color: "var(--card-solid)",
              flexShrink: 0,
            }}
          >
            {badge}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
