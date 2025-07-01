export interface Profile {
  public_key: string;
  ranking: number;
  imbalance: number;
  locale?: string;
  label?: string;
  bio?: string;
  count_id?: string;
  height?: number;
  error?: string;
}

export interface GraphNode {
  id: number;
  group?: number;
  neighbors?: GraphNode[];
  links?: GraphLink[];
  pubkey: string;
  label: string;
  locale?: string;
  ranking: number;
  imbalance: number;
}

export interface GraphLink {
  source: number;
  target: number;
  value: number;
  height: number;
  time: number;
}

export interface CountHeader {
  previous: string;
  hash_list_root: string;
  time: number;
  target: string;
  point_work: string;
  nonce: number;
  height: number;
  consideration_count: number;
}

export interface CountIdHeaderPair {
  count_id: string;
  header: CountHeader;
}

export interface Count {
  header: CountHeader;
  considerations: Consideration[];
}

export interface Consideration {
  time: number;
  nonce?: number;
  by?: string;
  for: string;
  memo: string;
  series?: number;
  signature?: string;
}
