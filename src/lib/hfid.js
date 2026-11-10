/**
 * Reaching HiFive ID from inside a Worker.
 *
 * Cloudflare refuses a subrequest from one Worker to another Worker on the same zone
 * (error 1042). Every HiFive module lives on `*.sinusuresh.workers.dev`, so an ordinary
 * `fetch()` to HiFive ID fails from here — not sometimes, always.
 *
 * That single fact explains two things at once:
 *
 *   - Why a token that verifies perfectly outside the Worker was rejected inside it. The
 *     JWKS fetch returned Cloudflare's HTML error page, `jose` could not parse a key set,
 *     and every request 401'd.
 *   - Why Recruitment embeds HiFive ID's public key instead of using JWKS. The handover
 *     presents JWKS as "the reference template" and the embedded key as Recruitment's own
 *     choice. On the evidence, the template cannot have been run Worker-to-Worker on this
 *     zone at all.
 *
 * The fix is a service binding: `env.HFID.fetch()` goes through Cloudflare's internal
 * routing rather than the network, so the zone restriction does not apply. It also removes a
 * public network hop for every sign-in.
 *
 * `HFID_ROSTER_URL` and `HFID_JWKS_URL` still describe the paths, and the plain-`fetch`
 * fallback is kept for local `wrangler dev` and for the day HiFive ID moves to a custom
 * domain — at which point the binding can go and nothing else changes.
 */

/**
 * Fetch a path from HiFive ID. `path` is the pathname, e.g. `/roster?app=inventory`.
 * The origin comes from the binding when one exists, and from the URL otherwise.
 */
export async function hfidFetch(env, path, init = {}) {
  if (env.HFID?.fetch) {
    // The hostname on this URL is ignored by the binding; the path is what routes.
    return env.HFID.fetch(new Request(`https://hifive-id${path}`, init));
  }
  const base = new URL(env.HFID_JWKS_URL);
  return fetch(new Request(`${base.origin}${path}`, init));
}

export const jwksPath = (env) => new URL(env.HFID_JWKS_URL).pathname;

