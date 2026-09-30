import type { Route } from '../mock-backend';
import { MockError, validation } from '../mock-error';
import { toUser } from './auth';
import { noContent, ok, required, text } from './util';

export const accountRoutes: Route[] = [
  {
    method: 'GET',
    path: '/account/me',
    role: 'any',
    handle: ({ db, user }) => ok(toUser(db, user)),
  },
  {
    method: 'PATCH',
    path: '/account/me',
    role: 'any',
    handle: ({ db, user, body, touch }) => {
      const input = body as Record<string, unknown>;
      user.firstName = required(input['firstName'], 'firstName');
      user.lastName = required(input['lastName'], 'lastName');
      user.initials = text(input['initials'])?.slice(0, 3);
      touch();
      return ok(toUser(db, user));
    },
  },
  {
    method: 'POST',
    path: '/account/password',
    role: 'any',
    handle: ({ user, body, touch }) => {
      const { currentPassword, newPassword } = body as Record<string, string | undefined>;
      if (currentPassword !== user.password) throw new MockError(400, 'wrong_password');
      if (!newPassword || newPassword.length < 8) throw validation('newPassword too short');
      user.password = newPassword;
      touch();
      return noContent();
    },
  },
];
