export interface OpaqueTokenHasher {
  hash(token: string): Promise<string>;
}
