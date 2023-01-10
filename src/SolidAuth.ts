import * as logging from 'lib0/logging';
import {
  handleIncomingRedirect,
  getDefaultSession,
  Session,
} from '@inrupt/solid-client-authn-browser';

const log = logging.createModuleLogger('solid-auth');

export const login = async (
  oidcIssuer = 'https://inrupt.net',
  redirectUrl = window.location.href,
  clientName = 'SyncedStore',
): Promise<Session> => {
  await handleIncomingRedirect({ restorePreviousSession: true });

  const session = getDefaultSession();

  if (!session.info.isLoggedIn) {
    await session.login({
      oidcIssuer: oidcIssuer,
      redirectUrl: redirectUrl,
      clientName: clientName,
    });
  }

  return session;
};

export function RequireAuth(
  target: any,
  key: string,
  descriptor: PropertyDescriptor,
) {
  const original = descriptor.value;
  descriptor.value = function (...args: any[]) {
    const session = getDefaultSession();
    if (session.info.isLoggedIn) {
      return original.apply(this, args);
    } else {
      log(logging.RED, `Error: Unauthorized access on function: ${key}`);
      return;
    }
  };
  return descriptor;
}
