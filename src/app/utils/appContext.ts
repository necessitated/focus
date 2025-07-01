import { createContext } from 'react';
import {
  Count,
  CountIdHeaderPair,
  Consideration,
  Profile,
  GraphNode,
  GraphLink,
} from '../utils/appTypes';

interface AppState {
  publicKeys: string[][];
  setPublicKeys: (keys: string[][]) => void;
  selectedKeyIndex: [number, number];
  setSelectedKeyIndex: (index: [number, number]) => void;
  requestTipHeader: () => void;
  tipHeader?: CountIdHeaderPair;
  setTipHeader: (tipHeader: CountIdHeaderPair) => void;
  requestCountByHeight: (height: number) => void;
  requestCountById: (count_id: string) => void;
  currentCount?: Count | null;
  setCurrentCount: (currentCount: Count) => void;
  genesisCount?: Count | null;
  setGenesisCount: (genesisCount: Count) => void;
  requestProfile: (
    publicKeyB64: string,
    resultHandler: (profile: Profile) => void,
  ) => (() => void) | undefined;
  requestGraph: (publicKeyB64: string) => void;
  graph: {
    nodes: GraphNode[];
    links: GraphLink[];
  } | null;
  rankingFilter: number;
  setRankingFilter: (rankingFilter: number) => void;
  requestConsideration: (
    consideration_id: string,
    resultHandler: (consideration: Consideration) => void,
  ) => (() => void) | undefined;
  requestPkConsiderations: (
    publicKeyB64: string,
    resultHandler: (considerations: Consideration[]) => void,
  ) => (() => void) | undefined;
  pushConsideration: (
    to: string,
    memo: string,
    passphrase: string,
    selectedKeyIndex: [number, number],
    resultHandler: (data: { consideration_id: string; error: string }) => void,
  ) => Promise<(() => void) | undefined>;

  requestPendingConsiderations: (
    publicKeyB64: string,
    resultHandler: (considerations: Consideration[]) => void,
  ) => (() => void) | undefined;
  selectedNode: string;
  setSelectedNode: (node: string) => void;
  colorScheme: 'light' | 'dark';
}

export const AppContext = createContext<AppState>({
  publicKeys: [],
  setPublicKeys: () => {},
  selectedKeyIndex: [0, 0],
  setSelectedKeyIndex: (index: [number, number]) => {},
  tipHeader: undefined,
  requestTipHeader: () => {},
  setTipHeader: () => {},
  requestCountById: (count_id: string) => {},
  requestCountByHeight: (height: number) => {},
  currentCount: undefined,
  setCurrentCount: (currentCount: Count) => {},
  genesisCount: undefined,
  setGenesisCount: (genesisCount: Count) => {},
  requestProfile:
    (publicKeyB64: string, resultHandler: (profile: Profile) => void) =>
    () => {},
  requestGraph: (publicKeyB64: string) => {},
  graph: null,
  rankingFilter: 0,
  setRankingFilter: () => {},
  requestConsideration:
    (
      consideration_id: string,
      resultHandler: (consideration: Consideration) => void,
    ) =>
    () => {},
  requestPkConsiderations:
    (
      publicKeyB64: string,
      resultHandler: (considerations: Consideration[]) => void,
    ) =>
    () => {},
  requestPendingConsiderations:
    (
      publicKeyB64: string,
      resultHandler: (considerations: Consideration[]) => void,
    ) =>
    () => {},
  selectedNode: '',
  setSelectedNode: () => {},
  colorScheme: 'light',
  pushConsideration: (
    to: string,
    memo: string,
    passphrase: string,
    selectedKeyIndex: [number, number],
    resultHandler: (data: { consideration_id: string; error: string }) => void,
  ) => Promise.resolve(undefined),
});
