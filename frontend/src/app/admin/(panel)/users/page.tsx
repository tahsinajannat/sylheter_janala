import type { Metadata } from 'next';
import { adminGet, requireRole } from '@/lib/admin/server';
import type { StaffUser } from '@/lib/admin/types';
import { UserManager } from '@/modules/admin/user-manager';
import { PageHeader } from '@/modules/admin/ui';

export const metadata: Metadata = { title: 'Staff accounts' };

export default async function UsersPage() {
  const me = await requireRole('admin');
  const users = await adminGet<StaffUser[]>('/admin/users');
  return (
    <>
      <PageHeader title="Staff accounts" description="Who can sign in to the newsroom, and what they can do." />
      <UserManager users={users.data} meId={me.id} />
    </>
  );
}
