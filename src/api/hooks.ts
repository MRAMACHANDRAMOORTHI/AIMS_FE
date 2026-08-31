import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./client";
import type { Classification } from "./types";

/**
 * Loads `path` and re-loads on demand.
 *
 * Deliberately small. This console's pattern is load → act → reload, which a
 * query library would handle at the cost of an abstraction the team then has
 * to learn. `reload()` after a mutation is enough here.
 */
export function useApi<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(path !== null);

  // Guards against a slow response for an old path landing after a new one.
  const latest = useRef(0);

  const load = useCallback(async () => {
    if (path === null) {
      setData(null);
      setLoading(false);
      return;
    }

    const ticket = ++latest.current;
    setLoading(true);

    try {
      const result = await api.get<T>(path);
      if (ticket === latest.current) {
        setData(result);
        setError(null);
      }
    } catch (caught) {
      if (ticket === latest.current) setError(caught);
    } finally {
      if (ticket === latest.current) setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, error, loading, reload: load };
}

/**
 * Runs a mutation, tracking whether it is in flight and what it threw.
 *
 * The thrown value is kept rather than flattened to a string, so a form can
 * ask a `ValidationError` which field failed.
 */
export function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const run = useCallback(
    async <T>(work: () => Promise<T>): Promise<T | undefined> => {
      setBusy(true);
      setError(null);
      try {
        return await work();
      } catch (caught) {
        setError(caught);
        return undefined;
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  return { run, busy, error, clearError: () => setError(null) };
}

/**
 * The classification vocabulary, fetched once and shared.
 *
 * Every dropdown and every conditional field in this console comes from here,
 * so a value the API would reject cannot appear in a form. Cached at module
 * scope because it changes only when the backend is redeployed.
 */
let cached: Promise<Classification> | null = null;

export function useClassification() {
  const [data, setData] = useState<Classification | null>(null);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    cached ??= api.get<Classification>("/reference/classification");

    let live = true;
    cached.then(
      (result) => live && setData(result),
      (caught) => {
        // Do not cache a failure — the next mount should retry.
        cached = null;
        if (live) setError(caught);
      },
    );

    return () => {
      live = false;
    };
  }, []);

  return { classification: data, error };
}
