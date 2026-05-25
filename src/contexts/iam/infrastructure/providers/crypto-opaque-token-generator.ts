import { randomBytes } from 'node:crypto';
import { OpaqueTokenGenerator } from '../../application/ports/opaque-token-generator.port';

export class CryptoOpaqueTokenGenerator implements OpaqueTokenGenerator {
  generate(): Promise<string> {
    return Promise.resolve(randomBytes(48).toString('base64url'));
  }
}
