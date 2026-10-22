'use client';

import { useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { admin } from '@/lib/admin/client';
import type { Role, StaffUser } from '@/lib/admin/types';
import { DataTable, Field, Modal, NativeSelect, Toggle, useAction } from './ui';

const ROLES: { id: Role; label: string; hint: string }[] = [
  { id: 'admin', label: 'Admin', hint: 'Everything, including staff accounts and settings.' },
  { id: 'editor', label: 'Editor', hint: 'Publishes content and manages comments, subscribers and newsletters.' },
  { id: 'author', label: 'Author', hint: 'Writes drafts; an editor publishes them.' },
];

function UserDialog({ user, me, onClose }: { user: StaffUser | null; me: string; onClose: () => void }) {
  const { busy, run } = useAction();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>(user?.role ?? 'author');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [isActive, setIsActive] = useState(user?.isActive ?? true);
  const self = user?.id === me;

  async function submit() {
    const ok = await run(
      () =>
        user
          ? admin.patch(`/users/${user.id}`, { name: name.trim(), role, bio: bio.trim() || null, isActive, ...(password ? { password } : {}) })
          : admin.post('/users', { name: name.trim(), email: email.trim(), password, role, bio: bio.trim() || null }),
      { success: 'Saved' },
    );
    if (ok) onClose();
  }

  return (
    <Modal open onOpenChange={(o) => !o && onClose()} title={user ? 'Edit staff account' : 'New staff account'}>
      <div className="grid gap-3">
        <Field label="Name *">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Email *" hint={user ? 'The email cannot be changed.' : undefined}>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={!!user} />
        </Field>
        <Field label={user ? 'New password' : 'Password *'} hint={user ? 'Leave empty to keep the current one. 8 to 72 characters.' : '8 to 72 characters.'}>
          <Input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <Field label="Role" hint={ROLES.find((r) => r.id === role)?.hint}>
          <NativeSelect value={role} onChange={(e) => setRole(e.target.value as Role)} disabled={self}>
            {ROLES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Short bio" hint="Shown on the author page.">
          <Textarea rows={2} value={bio} onChange={(e) => setBio(e.target.value)} maxLength={500} />
        </Field>
        {user && <Toggle checked={isActive} onChange={setIsActive} label="Account active" hint={self ? 'You cannot deactivate your own account.' : 'Turn off to block sign-in without deleting the account.'} />}
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button disabled={busy || name.trim().length < 2 || (!user && (!email || password.length < 8))} onClick={submit}>
          Save
        </Button>
      </div>
    </Modal>
  );
}

export function UserManager({ users, meId }: { users: StaffUser[]; meId: string }) {
  const [editing, setEditing] = useState<{ user: StaffUser | null } | null>(null);
  return (
    <div>
      <div className="mb-3 flex justify-end">
        <Button onClick={() => setEditing({ user: null })}>
          <Plus /> New account
        </Button>
      </div>
      <DataTable head={['Name', 'Role', 'Email', 'Status', '']}>
        {users.map((u) => (
          <tr key={u.id}>
            <td className="font-medium">{u.name}</td>
            <td className="capitalize">{u.role}</td>
            <td className="text-muted-foreground">{u.email}</td>
            <td>{u.isActive ? <Badge variant="outline">Active</Badge> : <Badge variant="secondary">Disabled</Badge>}</td>
            <td className="text-right">
              <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => setEditing({ user: u })}>
                <Pencil />
              </Button>
            </td>
          </tr>
        ))}
      </DataTable>
      {editing && <UserDialog user={editing.user} me={meId} onClose={() => setEditing(null)} />}
    </div>
  );
}
