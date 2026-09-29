import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export function useUrlFilter(key: string, defaultValue = ''): [string, (v: string) => void] {
  const [params, setParams] = useSearchParams();
  const value = params.get(key) || defaultValue;

  const setValue = useCallback((v: string) => {
    setParams(prev => {
      const next = new URLSearchParams(prev);
      if (v === '' || v === defaultValue) next.delete(key);
      else next.set(key, v);
      return next;
    }, { replace: true });
  }, [key, defaultValue, setParams]);

  return [value, setValue];
}
