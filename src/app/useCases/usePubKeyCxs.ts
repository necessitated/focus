import { useContext, useEffect, useState } from 'react';
import { AppContext } from '../utils/appContext';
import { Consideration } from '../utils/appTypes';

export const usePubKeyConsiderations = (pubKey: string) => {
  const { requestPkConsiderations } = useContext(AppContext);
  const [pkConsiderations, setPKConsiderations] = useState<Consideration[]>([]);

  useEffect(() => {
    let cleanup = () => {};
    const timeoutId = window.setTimeout(() => {
      if (pubKey) {
        cleanup =
          requestPkConsiderations(pubKey, (pkx) => {
            setPKConsiderations(pkx);
          }) ?? cleanup;
      }
    }, 0);
    return () => {
      cleanup();
      window.clearTimeout(timeoutId);
    };
  }, [pubKey, requestPkConsiderations]);

  return pkConsiderations;
};
