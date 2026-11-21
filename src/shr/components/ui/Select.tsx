/** components/ui/Select.tsx */
import React, { useEffect, useRef } from "react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode;
  error?: string;
  warn?: string;
}

export function Select({ children, style, error, warn, onChange, value, ...rest }: SelectProps) {
  const borderColor = error ? "var(--danger)" : warn ? "var(--warn)" : "var(--border)";
  const selectRef = useRef<HTMLSelectElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const lastValRef = useRef(value);
  lastValRef.current = value;

  useEffect(() => {
    const el = selectRef.current;
    if (!el) return;
    const handleNative = (ev: Event) => {
      const target = ev.target as HTMLSelectElement;
      if (target.value !== String(lastValRef.current ?? "")) {
        onChangeRef.current?.({
          ...ev,
          target,
          currentTarget: target,
        } as unknown as React.ChangeEvent<HTMLSelectElement>);
      }
    };
    el.addEventListener("change", handleNative);
    el.addEventListener("input", handleNative);
    return () => {
      el.removeEventListener("change", handleNative);
      el.removeEventListener("input", handleNative);
    };
  }, []);

  return (
    <div style={{
      width: "100%", height: 38, background: "var(--input-bg)",
      border: `1px solid ${borderColor}`, borderRadius: "var(--r-md)",
      padding: "0 12px", display: "flex", alignItems: "center",
      overflow: "hidden", boxSizing: "border-box",
      ...style,
    }}>
      <select
        ref={selectRef}
        value={value}
        onChange={(e) => {
          lastValRef.current = e.target.value;
          onChange?.(e);
        }}
        {...rest}
        style={{
          flex: 1, width: "100%", minWidth: 0, background: "none", border: "none",
          outline: "none", color: "var(--text)", fontFamily: "inherit",
          fontSize: (style as any)?.fontSize || "var(--fs-base)",
        }}
      >
        {children}
      </select>
    </div>
  );
}
