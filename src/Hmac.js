export class Hmac {
  constructor(secret, cryptoEngine = null) {
    this.__secret = secret;
    this.__crypto = cryptoEngine || crypto;
  }

  /**
   * Signs a simple message. This function can only be invoked after the secret has been defined. The secret can be defined either in the construction method as in `new FoxySigner(mySecret)` or by invoking the setSecret method, as in `signer.setSecret(mySecret)`
   *
   * @param {string} message the message to be signed.
   * @returns {Promise<string>} signed message.
   */
  async sign(message) {
    if (this.__secret === undefined) {
      throw new Error("No secret was provided to build the hmac");
    }
    const encodedMessage = new TextEncoder().encode(message);
    const signature = await this.__crypto.subtle.sign(
      "HMAC",
      await this.__getKey(),
      encodedMessage
    );
    return btoa(String.fromCharCode(...Array.from(new Uint8Array(signature))));
  }

  async __getKey() {
    return this.__crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(this.__secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"]
    );
  }
}
