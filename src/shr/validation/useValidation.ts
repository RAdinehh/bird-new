/**
 * validation/useValidation.ts — هوک React برای اعتبارسنجی زنده
 *
 * استفاده:
 *   const { errors, isValid } = useValidation(schema, form, context);
 *   // errors.eatingCount → پیام خطا
 */
import { useMemo } from 'react';
import { z } from 'zod';
import type { ValidationContext } from './types';

export interface UseValidationResult {
  errors: Record<string, string>;
  isValid: boolean;
  errorList: string[];
}

export function useValidation<T>(
  schema: z.ZodSchema<T>,
  data: any,
  _context?: ValidationContext,
): UseValidationResult {
  return useMemo(() => {
    const result = schema.safeParse(data);
    if (result.success) {
      return { errors: {}, isValid: true, errorList: [] };
    }
    const errors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join('.') || '_';
      if (!errors[key]) errors[key] = issue.message;
    }
    return {
      errors,
      isValid: false,
      errorList: Object.values(errors),
    };
  }, [schema, data]);
}
