/**
 * intelligence/FieldHint.tsx
 *
 * Wrapper: Field + AnomalyHint for forms.
 * Columns them with 0 gap so hint sits right under the field.
 */
import type { AnalysisContext } from './types';
import { AnomalyHint } from './AnomalyHint';
import { useAnomalyHint } from './useAnomalyHint';

export function FieldHint({
  fieldPath,
  value,
  context,
}: {
  fieldPath: string;
  value: number | string | null | undefined;
  context?: AnalysisContext;
}) {
  const warning = useAnomalyHint(fieldPath, value, context);
  if (!warning) return null;
  return <AnomalyHint warning={warning} />;
}
