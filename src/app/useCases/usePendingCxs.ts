import { useContext, useEffect, useState } from 'react';
import { AppContext } from '../utils/appContext';
import { Consideration } from '../utils/appTypes';

export const usePendingConsiderations = (selectedKey: string) => {
  const { requestPendingConsiderations } = useContext(AppContext);

  const [pendingConsiderations, setPending] = useState<Consideration[]>([]);

  useEffect(() => {
    let cleanup = () => {};
    const timeoutId = window.setTimeout(() => {
      if (selectedKey) {
        cleanup =
          requestPendingConsiderations(selectedKey, (pending) =>
            setPending(pending),
          ) ?? cleanup;
      }
    }, 0);

    return () => {
      cleanup();
      window.clearTimeout(timeoutId);
    };
  }, [selectedKey, requestPendingConsiderations]);

  return pendingConsiderations;
};
