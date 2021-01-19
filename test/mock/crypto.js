/**
 * Simple Mock Hmac class.
 *
 * Provides a sign method that
 */
export class MockHmac {
  constructor(secret, cryptoEngine, codes = {}) {
    this.willFail = false;
    this.__codes = codes;
    this.subtle = {
      importKey: () => "key",
      sign: () => Promise.resolve(new Buffer("signed")),
    };
  }

  sign() {
    return this.willFail ? Promise.reject() : Promise.resolve("signed");
  }

  signUrl() {
    return this.sign();
  }

  async signInput(el) {
    el.setAttribute("name", "signed");
  }

  async signOption(el) {
    el.setAttribute("value", "signed");
  }

  async signRadio(el) {
    await this.signOption(el);
  }

  async signTextArea(el) {
    await this.signInput(el);
  }
}
