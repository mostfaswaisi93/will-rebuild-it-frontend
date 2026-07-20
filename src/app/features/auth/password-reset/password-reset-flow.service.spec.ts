import { AccountRoleDto } from '@core/api/dto/auth.dto';
import { PasswordResetFlow } from './password-reset-flow.service';

const ACCOUNT: AccountRoleDto = {
  id: 'user-contractor-1',
  email: 'contractor@example.com',
  phone: '+970598334455',
  role: 'contractor',
  status: 'active',
  registrationComplete: true,
};

describe('PasswordResetFlow', () => {
  let flow: PasswordResetFlow;

  beforeEach(() => {
    flow = new PasswordResetFlow();
  });

  it('starts with no step satisfied', () => {
    expect(flow.hasIdentity()).toBeFalse();
    expect(flow.hasChallenge()).toBeFalse();
    expect(flow.hasResetToken()).toBeFalse();
  });

  it('unlocks each step in order', () => {
    flow.setIdentity('contractor@example.com', ACCOUNT);
    expect(flow.hasIdentity()).toBeTrue();
    expect(flow.hasChallenge()).toBeFalse();

    flow.setChallenge('email', 'challenge-1');
    expect(flow.hasChallenge()).toBeTrue();
    expect(flow.hasResetToken()).toBeFalse();

    flow.setResetToken('reset-1');
    expect(flow.hasResetToken()).toBeTrue();
  });

  it('invalidates downstream state when the identity changes', () => {
    // Otherwise a code sent to the first address would still verify after the
    // user went back and entered a different one.
    flow.setIdentity('contractor@example.com', ACCOUNT);
    flow.setChallenge('email', 'challenge-1');
    flow.setResetToken('reset-1');

    flow.setIdentity('admin@example.com', { ...ACCOUNT, role: 'admin' });

    expect(flow.hasChallenge()).toBeFalse();
    expect(flow.hasResetToken()).toBeFalse();
  });

  it('invalidates the reset token when a new code is sent', () => {
    flow.setIdentity('contractor@example.com', ACCOUNT);
    flow.setChallenge('email', 'challenge-1');
    flow.setResetToken('reset-1');

    flow.setChallenge('sms', 'challenge-2');
    expect(flow.hasResetToken()).toBeFalse();
  });

  it('masks both destinations for the channel step', () => {
    flow.setIdentity('contractor@example.com', ACCOUNT);
    expect(flow.maskedEmail()).toBe('co********@example.com');
    expect(flow.maskedPhone()).toBe('••••••••4455');
  });

  it('reports no phone when the account has none', () => {
    flow.setIdentity('admin@example.com', { ...ACCOUNT, phone: '' });
    expect(flow.maskedPhone()).toBe('');
  });

  it('routes to the final step matching the journey', () => {
    expect(flow.finalStep()).toBe('reset');
    flow.intent.set('activate');
    expect(flow.finalStep()).toBe('activate');
  });

  it('clears everything on reset', () => {
    flow.setIdentity('contractor@example.com', ACCOUNT);
    flow.setChallenge('email', 'challenge-1');
    flow.setResetToken('reset-1');

    flow.reset();

    expect(flow.hasIdentity()).toBeFalse();
    expect(flow.hasChallenge()).toBeFalse();
    expect(flow.hasResetToken()).toBeFalse();
  });
});
