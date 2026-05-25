export interface OpaqueTokenGenerator {
  generate(): Promise<string>;
}
