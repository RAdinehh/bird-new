/**
 * components/ui/Select.tsx — انتخاب‌گر یکپارچه روی SelectSheetShell (بدون منوی بومی اندروید)
 *
 * سازگار با API استاندارد <Select><option ... /></Select>:
 *   - ۱ تا ۴ گزینه → SelectSheetShell با placement="center" (وسط صفحه، بدون هدر اضافه)
 *   - ۵ گزینه و بالاتر → SelectSheetShell با placement="bottom" (شیت از پایین)
 */
import React, { useMemo, useState } from "react";
import SelectSheetShell, { SheetGroup, SheetItem } from "../SelectSheetShell";
import { Input } from "./Input";
import { getGlobalFormat } from "../../units/useFormat";

interface ParsedOption {
  value: string;
  label: string;
  disabled?: boolean;
  group?: string;
}

function extractText(node: React.ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (React.isValidElement(node)) return extractText((node.props as any)?.children);
  return "";
}

function parseOptions(children: React.ReactNode, group?: string, out: ParsedOption[] = []): ParsedOption[] {
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    const props = child.props as any;
    if (child.type === React.Fragment) {
      parseOptions(props?.children, group, out);
    } else if (child.type === "optgroup") {
      parseOptions(props?.children, props?.label || group, out);
    } else if (child.type === "option") {
      const label = extractText(props?.children).trim();
      const val = props?.value !== undefined ? String(props.value) : label;
      out.push({ value: val, label: label || val, disabled: !!props?.disabled, group });
    }
  });
  return out;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode;
  error?: string;
  warn?: string;
  modalTitle?: string;
}

export function Select({
  children,
  style,
  error,
  warn,
  onChange,
  value,
  defaultValue,
  disabled,
  modalTitle,
  className,
  name,
  id,
  required,
  ...rest
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [internalVal, setInternalVal] = useState<string>(String(defaultValue ?? ""));

  const isControlled = value !== undefined;
  const currentVal = String(isControlled ? (value ?? "") : internalVal);

  const options = useMemo(() => parseOptions(children), [children]);
  const currentOption = options.find((o) => o.value === currentVal) ?? options[0];

  const isShortList = options.length <= 4;
  const searchable = !isShortList && options.length > 5;

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const grouped = useMemo(() => {
    const map: Record<string, ParsedOption[]> = {};
    filtered.forEach((o) => {
      const g = o.group || "_flat";
      if (!map[g]) map[g] = [];
      map[g].push(o);
    });
    return map;
  }, [filtered]);

  const groupKeys = Object.keys(grouped);
  const hasGroups = groupKeys.length > 1 || (groupKeys.length === 1 && groupKeys[0] !== "_flat");

  const borderColor = error ? "var(--danger)" : warn ? "var(--warn)" : "var(--border)";
  const resolvedTitle = modalTitle || rest["aria-label"] || "انتخاب";

  const handleClose = () => {
    setOpen(false);
    setQuery("");
  };

  const handlePick = (val: string) => {
    if (!isControlled) setInternalVal(val);
    if (onChange) {
      const target = { value: val, name: name ?? "", id: id ?? "" } as HTMLSelectElement;
      onChange({
        target,
        currentTarget: target,
        type: "change",
        bubbles: true,
        preventDefault: () => {},
        stopPropagation: () => {},
      } as unknown as React.ChangeEvent<HTMLSelectElement>);
    }
    handleClose();
  };

  return (
    <>
      <button
        type="button"
        id={id}
        className={className}
        disabled={disabled}
        onClick={() => { if (!disabled) { setOpen(true); setQuery(""); } }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={rest["aria-label"]}
        aria-invalid={!!error}
        aria-required={required}
        style={{
          width: "100%",
          height: 38,
          background: "var(--input-bg)",
          border: `1px solid ${borderColor}`,
          borderRadius: "var(--r-md)",
          padding: "0 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          overflow: "hidden",
          boxSizing: "border-box",
          cursor: disabled ? "not-allowed" : "pointer",
          fontFamily: "inherit",
          fontSize: (style as any)?.fontSize || "var(--fs-base)",
          color: currentOption && currentOption.value !== "" ? "var(--text)" : "var(--dim)",
          opacity: disabled ? 0.55 : 1,
          textAlign: "right",
          outline: "none",
          ...style,
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
          {currentOption ? currentOption.label : "— انتخاب —"}
        </span>
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24"
          fill="none" stroke="var(--muted)" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      <SelectSheetShell
        open={open}
        onClose={handleClose}
        placement={isShortList ? "center" : "bottom"}
        title={resolvedTitle}
        subtitle={isShortList ? undefined : `${getGlobalFormat().count(options.length)} مورد`}
        searchable={searchable}
        onSearchClear={() => setQuery("")}
        searchNode={
          <Input
            placeholder="جستجو..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        }
      >
        {filtered.length === 0 ? (
          <div style={{ padding: "32px 12px", textAlign: "center", color: "var(--muted)", fontSize: "var(--fs-base)" }}>
            <div style={{ fontSize: 28, marginBottom: 6, opacity: 0.5 }}>🔍</div>
            <div>چیزی پیدا نشد</div>
          </div>
        ) : hasGroups ? (
          groupKeys.map((gKey) => (
            <SheetGroup key={gKey} title={gKey === "_flat" ? "" : gKey} count={grouped[gKey].length}>
              {grouped[gKey].map((o, idx) => (
                <SheetItem
                  key={`${o.value}-${idx}`}
                  title={o.label}
                  selected={currentVal === o.value}
                  onClick={() => !o.disabled && handlePick(o.value)}
                />
              ))}
            </SheetGroup>
          ))
        ) : (
          <div style={{
            border: "1px solid var(--border)",
            borderRadius: "var(--r-lg, 12px)",
            overflow: "hidden",
          }}>
            {filtered.map((o, idx) => (
              <SheetItem
                key={`${o.value}-${idx}`}
                title={o.label}
                selected={currentVal === o.value}
                onClick={() => !o.disabled && handlePick(o.value)}
              />
            ))}
          </div>
        )}
      </SelectSheetShell>
    </>
  );
}
