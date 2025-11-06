import type { Actions, PageServerLoad } from './$types';
import { isPasswordSet, setAdminPassword, verifyAdminPassword } from '$lib/server/auth';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
  const isSet = await isPasswordSet();
  return { isSet };
};

export const actions: Actions = {
  default: async ({ request }) => {
    const form = await request.formData();
    const current = (form.get('current') || '').toString();
    const next = (form.get('next') || '').toString();
    const confirm = (form.get('confirm') || '').toString();

    if (!next || !confirm) {
      return fail(400, { error: 'New password and confirmation are required' });
    }
    if (next !== confirm) {
      return fail(400, { error: 'New password and confirmation do not match' });
    }

    const alreadySet = await isPasswordSet();
    if (alreadySet) {
      const ok = await verifyAdminPassword(current);
      if (!ok) {
        return fail(400, { error: 'Current password is incorrect' });
      }
    }

    await setAdminPassword(next);
    return { message: 'Password updated successfully' };
  }
};


