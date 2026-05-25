import { createHash } from 'node:crypto';
import { OpaqueTokenHasher } from '../../application/ports/opaque-token-hasher.port';

export class Sha256OpaqueTokenHasher implements OpaqueTokenHasher {
  hash(token: string): Promise<string> {
    return Promise.resolve(
      createHash('sha256').update(token).digest('hex'),
    );
  }
}
