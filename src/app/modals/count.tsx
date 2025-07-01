import { ConsiderationList } from '../components/consideration';
import { PageShell } from '../components/pageShell';
import { useContext, useEffect } from 'react';
import { AppContext } from '../utils/appContext';

const Count = ({ onDismiss }: { onDismiss?: () => void }) => {
  const { tipHeader, requestCountByHeight, currentCount, genesisCount } =
    useContext(AppContext);

  const tipHeight = tipHeader?.header.height ?? 0;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      requestCountByHeight(tipHeight);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [tipHeight, requestCountByHeight]);

  return (
    <PageShell
      onDismissModal={onDismiss}
      renderBody={() => (
        <>
          <ConsiderationList
            heading="First Count"
            considerations={genesisCount?.considerations ?? []}
          />
          {!!tipHeight && (
            <ConsiderationList
              heading={`Current Count: #${tipHeight}`}
              considerations={currentCount?.considerations ?? []}
            />
          )}
        </>
      )}
    />
  );
};

export default Count;
