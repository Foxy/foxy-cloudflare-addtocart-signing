interface CryptoEngine {
  subtle: {
    sign: (
      algorithm:
        | string
        | Algorithm
        | RsaPssParams
        | EcdsaParams
        | AesCmacParams,
      key: CryptoKey,
      data: ArrayBuffer
    ) => Promise<ArrayBuffer>;
    importKey: (
      format: "jwk" | "raw",
      keyData: JsonWebKey | Uint8Array,
      algorithm:
        | string
        | Algorithm
        | RsaHashedImportParams
        | EcKeyImportParams
        | HmacImportParams
        | DhImportKeyParams
        | AesKeyAlgorithm,
      extractable: boolean,
      keyUsages: KeyUsage[]
    ) => Promise<CryptoKey>;
  };
}

export class Hmac {
  private readonly __secret: string;
  private readonly __crypto: CryptoEngine;

  constructor(secret: string, cryptoEngine: CryptoEngine | null = null) {
    this.__secret = secret;
    this.__crypto = cryptoEngine || (crypto as CryptoEngine);
  }

  /**
   * Signs a simple message. This function can only be invoked after the secret has been defined. The secret can be defined either in the construction method as in `new FoxySigner(mySecret)` or by invoking the setSecret method, as in `signer.setSecret(mySecret)`
   *
   * @param {string} message the message to be signed.
   * @returns {Promise<string>} signed message.
   */
  async sign(message: string): Promise<string> {
    const encodedMessage = new TextEncoder().encode(message);
    const signature = await this.__crypto.subtle.sign(
      "HMAC",
      await this.__getKey(),
      encodedMessage
    );
    return btoa(String.fromCharCode(...Array.from(new Uint8Array(signature))));
  }

  async __getKey(): Promise<CryptoKey> {
    return this.__crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(this.__secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"]
    );
  }
}
