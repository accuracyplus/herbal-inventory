/**
 * The two kinds of refusal the API gives.
 *
 * AuthError — who you are, or what your role allows (401 / 403).
 * DomainError — the request was understood but breaks a stock rule: not enough on the shelf,
 * a request already decided, an approval of your own adjustment. Always carries a sentence a
 * store keeper can act on, never a database message.
 */

export class AuthError extends Error {
  constructor(message, status = 401) {
    super(message);
    this.status = status;
  }
}

export class DomainError extends Error {
  constructor(code, message, status = 422, details) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export const refuse = (code, message, status = 422, details) => {
  throw new DomainError(code, message, status, details);
};
