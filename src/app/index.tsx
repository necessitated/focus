import { IonApp, setupIonicReact } from '@ionic/react';
import Flow from './modals/flow';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';
import { useState, useEffect } from 'react';

import { AppContext } from './utils/appContext';
import {
  Consideration,
  GraphLink,
  GraphNode,
  Profile,
  Count,
  CountIdHeaderPair,
} from './utils/appTypes';
import { usePersistentState } from './useCases/usePersistentState';

import { useCallback } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { signConsideration } from './useCases/useMind';
import {
  considerationID,
  parseGraphDOT,
  socketEventListener,
} from './utils/compat';

setupIonicReact({ mode: 'md' });

const App: React.FC = () => {
  const [selectedNode, setSelectedNode] = usePersistentState(
    'selected-node',
    '',
  );

  const [publicKeys, setPublicKeys] = usePersistentState<string[][]>(
    'public-keys',
    [[]],
  );

  const [selectedKeyIndex, setSelectedKeyIndex] = usePersistentState<
    [number, number]
  >('selected-key-index', [0, 0]);

  const [tipHeader, setTipHeader] = useState<CountIdHeaderPair>();
  const [currentCount, setCurrentCount] = usePersistentState<Count | null>(
    'current-count',
    null,
  );

  const [genesisCount, setGenesisCount] = usePersistentState<Count | null>(
    'genesis-count',
    null,
  );

  const [graph, setGraph] = usePersistentState<{
    nodes: GraphNode[];
    links: GraphLink[];
  } | null>('flow-graph', null);

  const [rankingFilter, setRankingFilter] = useState(0);

  const { sendJsonMessage, readyState } = useWebSocket(
    `wss://${selectedNode}`,
    {
      protocols: ['focalpoint.1'],
      onOpen: () => console.log('opened', selectedNode),
      onError: () => console.log('errored', selectedNode),
      shouldReconnect: () => true,
      share: true,
      onMessage: (event) => {
        const { type, body } = JSON.parse(event.data);

        switch (type) {
          case 'inv_count':
            document.dispatchEvent(
              new CustomEvent<{
                consideration_id: string;
                error: string;
              }>('inv_count', { detail: body.count_ids }),
            );
            requestTipHeader();
            break;
          case 'tip_header':
            setTipHeader(body);
            break;
          case 'profile':
            document.dispatchEvent(
              new CustomEvent<Profile>('profile', {
                detail: body,
              }),
            );
            break;
          case 'graph':
            setGraph(parseGraphDOT(body.graph, body.public_key, rankingFilter));
            break;
          case 'count':
            if (body.count.header.height === 0) {
              setGenesisCount(body.count);
            }
            setCurrentCount(body.count);
            break;
          case 'consideration':
            document.dispatchEvent(
              new CustomEvent<{
                consideration_id: string;
                consideration: Consideration;
              }>('consideration', {
                detail: {
                  consideration_id: body.consideration_id,
                  consideration: body.consideration,
                },
              }),
            );

            break;
          case 'push_consideration_result':
            document.dispatchEvent(
              new CustomEvent<{
                consideration_id: string;
                error: string;
              }>('push_consideration_result', { detail: body }),
            );
            break;
          case 'public_key_considerations':
            document.dispatchEvent(
              new CustomEvent<{
                public_key: string;
                considerations: Consideration[];
              }>('public_key_considerations', {
                detail: {
                  public_key: body.public_key,
                  considerations:
                    body.filter_counts?.flatMap((i: any) => i.considerations) ??
                    [],
                },
              }),
            );
            break;
          case 'filter_consideration_queue':
            document.dispatchEvent(
              new CustomEvent<Consideration[]>('filter_consideration_queue', {
                detail: body.considerations,
              }),
            );
            break;
        }
      },
    },
  );

  const requestPeers = useCallback(() => {
    if (readyState !== ReadyState.OPEN) return;
    sendJsonMessage({
      type: 'get_peer_addresses',
    });
  }, [readyState, sendJsonMessage]);

  const requestCountById = useCallback(
    (count_id: string) => {
      if (readyState !== ReadyState.OPEN) return;
      sendJsonMessage({
        type: 'get_count',
        body: { count_id },
      });
    },
    [readyState, sendJsonMessage],
  );

  const requestCountByHeight = useCallback(
    (height: number) => {
      if (readyState !== ReadyState.OPEN) return;
      sendJsonMessage({
        type: 'get_count_by_height',
        body: { height },
      });
    },
    [readyState, sendJsonMessage],
  );

  const requestTipHeader = useCallback(() => {
    if (readyState !== ReadyState.OPEN) return;
    sendJsonMessage({ type: 'get_tip_header' });
  }, [readyState, sendJsonMessage]);

  const requestProfile = useCallback(
    (publicKeyB64: string, resultHandler: (profile: Profile) => void) => {
      if (readyState !== ReadyState.OPEN) return;
      if (!publicKeyB64) throw new Error('missing publicKey');

      sendJsonMessage({
        type: 'get_profile',
        body: {
          public_key: publicKeyB64,
        },
      });

      return socketEventListener<Profile>('profile', (data) => {
        if (data.public_key === publicKeyB64) {
          resultHandler(data);
        }
      });
    },
    [readyState, sendJsonMessage],
  );

  const requestGraph = useCallback(
    (publicKeyB64: string = '') => {
      if (readyState !== ReadyState.OPEN) return;

      sendJsonMessage({
        type: 'get_graph',
        body: {
          public_key: publicKeyB64,
        },
      });
    },
    [readyState, sendJsonMessage],
  );

  const pushConsideration = async (
    to: string,
    memo: string,
    passphrase: string,
    selectedKeyIndex: [number, number],
    resultHandler: (data: { consideration_id: string; error: string }) => void,
  ) => {
    if (readyState !== ReadyState.OPEN) return;
    if (to && memo && tipHeader?.header.height && publicKeys.length) {
      const consideration = await signConsideration(
        to,
        memo,
        tipHeader?.header.height,
        selectedKeyIndex,
        passphrase,
      );

      if (!consideration) return;

      sendJsonMessage({
        type: 'push_consideration',
        body: {
          consideration,
        } as any,
      });

      return socketEventListener<{
        consideration_id: string;
        error: string;
      }>('push_consideration_result', (data) => {
        if (considerationID(consideration) === data.consideration_id) {
          resultHandler(data);
        }
      });
    }
  };

  const requestConsideration = useCallback(
    (
      consideration_id: string,
      resultHandler: (consideration: Consideration) => void,
    ) => {
      if (readyState !== ReadyState.OPEN) return;
      sendJsonMessage({
        type: 'get_consideration',
        body: { consideration_id },
      });

      return socketEventListener<{
        consideration_id: string;
        consideration: Consideration;
      }>('consideration', (data) => {
        if (considerationID(data.consideration) === consideration_id) {
          resultHandler(data.consideration);
        }
      });
    },
    [readyState, sendJsonMessage],
  );

  const requestPkConsiderations = useCallback(
    (
      publicKeyB64: string,
      resultHandler: (considerations: Consideration[]) => void,
    ) => {
      if (readyState !== ReadyState.OPEN) return () => {};
      if (!publicKeyB64) return () => {};
      if (!tipHeader?.header.height) return () => {};

      sendJsonMessage({
        type: 'get_public_key_considerations',
        body: {
          public_key: publicKeyB64,
          start_height: tipHeader?.header.height + 1,
          end_height: 0,
          limit: 10,
        },
      });

      return socketEventListener<{
        public_key: string;
        considerations: Consideration[];
      }>('public_key_considerations', (data) => {
        if (data.public_key === publicKeyB64) {
          resultHandler(data.considerations);
        }
      });
    },
    [readyState, sendJsonMessage, tipHeader],
  );

  const applyFilter = useCallback(
    (publicKeysB64: string[]) => {
      if (readyState !== ReadyState.OPEN) return;
      if (publicKeysB64.length) {
        sendJsonMessage({
          type: 'filter_add',
          body: {
            public_keys: publicKeysB64,
          },
        });
      }
    },
    [readyState, sendJsonMessage],
  );

  const requestPendingConsiderations = useCallback(
    (
      publicKeyB64: string,
      resultHandler: (considerations: Consideration[]) => void,
    ) => {
      if (readyState !== ReadyState.OPEN) return;
      //applyFilter must be called first with a public key
      applyFilter([publicKeyB64]);
      sendJsonMessage({
        type: 'get_filter_consideration_queue',
      });

      return socketEventListener<Consideration[]>(
        'filter_consideration_queue',
        (data) => {
          resultHandler(data);
        },
      );
    },
    [readyState, applyFilter, sendJsonMessage],
  );

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>(
    prefersDark.matches ? 'dark' : 'light',
  );

  useEffect(() => {
    const eventHandler = (mediaQuery: MediaQueryListEvent) =>
      setColorScheme(mediaQuery.matches ? 'dark' : 'light');

    prefersDark.addEventListener('change', eventHandler);

    return () => {
      prefersDark.removeEventListener('change', eventHandler);
    };
  }, [prefersDark, setColorScheme]);

  const appState = {
    publicKeys,
    setPublicKeys,
    selectedKeyIndex,
    setSelectedKeyIndex,
    requestTipHeader,
    tipHeader,
    setTipHeader,
    requestCountById,
    requestCountByHeight,
    currentCount,
    setCurrentCount,
    genesisCount,
    setGenesisCount,
    requestProfile,
    requestGraph,
    graph,
    rankingFilter,
    setRankingFilter,
    pushConsideration,
    requestConsideration,
    requestPkConsiderations,
    requestPendingConsiderations,
    selectedNode,
    setSelectedNode,
    colorScheme,
  };

  useEffect(() => {
    //First load
    if (!!selectedNode) {
      requestPeers();
      requestTipHeader();
      requestCountByHeight(0);
    }
  }, [selectedNode, requestTipHeader, requestPeers, requestCountByHeight]);

  return (
    <AppContext.Provider value={appState}>
      <IonApp>
        <Flow />
        <div id="fg-portal"></div>
      </IonApp>
    </AppContext.Provider>
  );
};

export default App;
