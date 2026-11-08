// A persistent anonymous session authorizes scans without an email/password.
// Share first-use initialization so concurrent calls create only one identity.
export function createPictureSession(client) {
  let pending = null;

  async function getOrCreate() {
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    if (data?.session) return data.session;

    const result = await client.auth.signInAnonymously();
    if (result.error) throw result.error;
    if (!result.data?.session) throw new Error('Picture reader session was not created.');
    return result.data.session;
  }

  return async function ensurePictureSession() {
    if (!pending) pending = getOrCreate().finally(() => { pending = null; });
    return pending;
  };
}
