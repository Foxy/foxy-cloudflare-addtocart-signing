/**
 * Simple Mock Hmac class.
 *
 * Provides a sign method that
 */
export class MockHmac {
  willFail: boolean;
  private __codes;
  subtle: {
    importKey: () => string;
    sign: () => Promise<ArrayBuffer>;
  };

  constructor(secret: string, cryptoEngine: any, codes = {}) {
    this.willFail = false;
    this.__codes = codes;
    this.subtle = {
      importKey: () => "key",
      sign: () => Promise.resolve(Buffer.from("signed", "utf-8")),
    };
  }

  sign() {
    return this.willFail ? Promise.reject() : Promise.resolve("signed");
  }

  signUrl() {
    return this.sign();
  }

  async signInput(el: Element) {
    el.setAttribute("name", "signed");
  }

  async signOption(el: Element) {
    el.setAttribute("value", "signed");
  }

  async signRadio(el: Element) {
    await this.signOption(el);
  }

  async signTextArea(el: Element) {
    await this.signInput(el);
  }
}
