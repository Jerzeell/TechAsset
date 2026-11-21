import { useCallback, useEffect, useRef, useState } from "react";
export function useResource<T>(loader: () => Promise<T>) {
  const ref = useRef(loader);
  ref.current = loader;
  const [data, setData] = useState<T | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [updated, setUpdated] = useState<Date | null>(null);
  const mounted = useRef(false),
    sequence = useRef(0);
  const reload = useCallback(async () => {
    const current = ++sequence.current;
    setLoading(true);
    setError("");
    try {
      const value = await ref.current();
      if (mounted.current && sequence.current === current) {
        setData(value);
        setUpdated(new Date());
      }
    } catch (e: any) {
      if (mounted.current && sequence.current === current)
        setError(e.message || "No se pudo cargar la información.");
    } finally {
      if (mounted.current && sequence.current === current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    mounted.current = true;
    reload();
    return () => {
      mounted.current = false;
    };
  }, [reload]);
  return { data, loading, error, updated, reload };
}
