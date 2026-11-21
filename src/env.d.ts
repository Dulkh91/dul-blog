import type { UserProp } from '@components/types/userType';

declare global {
  namespace App {
    interface Locals {
      user: UserProp | null;
    }
  }
}
