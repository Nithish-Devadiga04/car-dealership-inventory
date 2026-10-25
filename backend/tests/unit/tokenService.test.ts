import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../../src/errors';
import { JwtTokenService } from '../../src/services/tokenService';

describe('JwtTokenService', () => {
  const service = new JwtTokenService('unit-secret', '1h');

  it('signs a token that verifies back to the same identity', () => {
    const token = service.sign({ id: 7, role: 'admin' });
    expect(service.verify(token)).toEqual({ id: 7, role: 'admin' });
  });

  it('rejects garbage', () => {
    expect(() => service.verify('not-a-jwt')).toThrow(UnauthorizedError);
  });

  it('rejects a token signed with a different secret', () => {
    const forged = new JwtTokenService('other-secret', '1h').sign({ id: 1, role: 'admin' });
    expect(() => service.verify(forged)).toThrow(UnauthorizedError);
  });

  it('rejects an expired token', () => {
    const expired = new JwtTokenService('unit-secret', '-10s').sign({ id: 1, role: 'user' });
    expect(() => service.verify(expired)).toThrow(UnauthorizedError);
  });

  it('rejects a validly signed token with an unknown role claim', () => {
    const token = jwt.sign({ role: 'superuser' }, 'unit-secret', { subject: '1' });
    expect(() => service.verify(token)).toThrow(UnauthorizedError);
  });

  it('rejects an unsigned ("alg: none") token', () => {
    const none = jwt.sign({ role: 'admin' }, '', { algorithm: 'none', subject: '1' });
    expect(() => service.verify(none)).toThrow(UnauthorizedError);
  });
});
