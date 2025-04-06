export const auth = async () => {
  return {
    user: {
      id: 'user_john_doe',
      name: 'John Doe',
      email: 'john@example.com',
      image: `https://avatar.vercel.sh/john@example.com`,
    },
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
  };
};
