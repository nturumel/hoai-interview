'use server';

export async function auth() {
  return {
    user: {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      image: '/avatar.png',
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
}

export async function signOut({ redirectTo }: { redirectTo: string }) {
  return { success: true };
}
