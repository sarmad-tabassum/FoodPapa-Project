import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

export const SUPABASE_URL = 'https://hnidlzruuoadphaaakgh.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_H2XkRJw3VBkPdm08intoLA_KXXd_WB-';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user ?? null;
}

export async function getProfile(userId) {
  if (!userId) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    window.location.href = 'userlogin.html';
    return null;
  }
  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) {
    window.location.href = 'AdminSignin.html';
    return null;
  }

  const profile = await getProfile(user.id);
  if (profile?.role !== 'admin') {
    window.location.href = 'userhome.html';
    return null;
  }

  return { user, profile };
}

export async function signOutUser(redirectTo = 'userlogin.html') {
  await supabase.auth.signOut();
  window.location.href = redirectTo;
}

export function friendlyAuthError(error) {
  const message = error?.message || 'Something went wrong. Please try again.';
  return message
    .replace('Invalid login credentials', 'Email or password is incorrect.')
    .replace('User already registered', 'This email is already registered.');
}
