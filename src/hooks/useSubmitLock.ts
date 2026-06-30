import { useCallback, useState } from 'react';

export function useSubmitLock() {
  const [submitting, setSubmitting] = useState(false);

  const withLock = useCallback(async (task: () => Promise<void>) => {
    if (submitting) return;

    setSubmitting(true);
    try {
      await task();
    } finally {
      setSubmitting(false);
    }
  }, [submitting]);

  return { submitting, withLock };
}
