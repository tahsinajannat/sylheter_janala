import { getStaff } from '@/lib/admin/server';
import { AdminShell } from '@/modules/admin/shell';

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const me = await getStaff();
  return <AdminShell me={me}>{children}</AdminShell>;
}
