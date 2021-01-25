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
    return toHex(new Uint8Array(signature));
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
// Pre-Init
const LUT_HEX_4b = [
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
];
const LUT_HEX_8b = new Array(0x100);
for (let n = 0; n < 0x100; n++) {
  LUT_HEX_8b[n] = `${LUT_HEX_4b[(n >>> 4) & 0xf]}${LUT_HEX_4b[n & 0xf]}`;
}
// End Pre-Init
function toHex(buffer: Buffer): string {
  let out = "";
  for (let idx = 0, edx = buffer.length; idx < edx; idx++) {
    out += LUT_HEX_8b[buffer[idx]];
  }
  return out;
}
