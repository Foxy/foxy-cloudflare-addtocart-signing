/**
 * Simple Mock Hmac class.
 *
 * Provides a sign method that
 */
export class MockHmac {

  constructor() {
    this.willFail = false
  }

  sign() {
    return this.willFail ? Promise.reject() : Promise.resolve("signed");
  }

  signUrl() {
    return this.sign();
  }


}
