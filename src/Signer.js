
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
    const signature = await this.__crypto.subtle.sign("HMAC", await this.__getKey(), encodedMessage);
    return btoa(String.fromCharCode(...Array.from(new Uint8Array(signature))));
  }

  async __getKey() {
    return this.__crypto.subtle.importKey("raw",
        new TextEncoder().encode(this.__secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign", "verify"]
    );
  }

}

/**
 * HMAC signing utility. Methods are named after what it is to be signed, to
 * allow for an easy to read code in the user application.
 *
 * @tutorial https://wiki.foxycart.com/v/2.0/hmac_validation
 * @example const signer = new Signer(mySecret); // or const signer = new Signer(); signer.setSecret(mySecret);
 *          signer.signHtml('<html lang="en">...</html>'); // signs a URL
 *          signer.signFile("/var/www/html/src/.../index.html", "/var/www/html/target/.../index.html"); // signs an HTML file
 *          signer.signUrl("http://..."); // signs a URL
 */
export class Signer {

  /**
   * Creates an instance of this class.
   *
   * @param {string} secret OAuth2 client secret for your integration.
   * @param {Object} codes an object that contains the code and parent code for each of the products prefixes.
   * @param {{sign: Function}} hmacEngine that is able to create Base64 encoded HMAC signatures of a string.
   */
  constructor(secret, codes, hmacEngine) {
    this.__secret = secret;
    this.__codes = codes;
    this.hmac = hmacEngine ? hmacEngine : new Hmac(secret);
  }

  /**
   * Signs a query string.
   * All query fields withing the query string will be signed, provided it is a proper URL and there is a code field
   *
   * @param {string} urlStr Full URL including the query string that needs to be signed.
   * @returns {Promise<string>} the signed query string.
   */
  async signUrl(urlStr) {
    // Build a URL object
    if (Signer.__isSigned(urlStr)) {
      console.error("Attempt to sign a signed URL", urlStr);
      return urlStr;
    }
    // Do not change invalid URLs
    let url;
    let stripped;
    try {
      url = new URL(urlStr);
      stripped = new URL(url.origin);
    } catch (e) {
      //console.assert(e.code === "ERR_INVALID_URL");
      return urlStr;
    }
    const originalParams = url.searchParams;
    const newParams = stripped.searchParams;
    const code = Signer.__getCodeFromURL(url);
    // If there is no code, return the same URL
    if (!code) {
      return urlStr;
    }
    // sign the url object
    for (const p of originalParams.entries()) {
      const signed = (
        await this.__signQueryArg(
          decodeURIComponent(p[0]),
          decodeURIComponent(code),
          decodeURIComponent(p[1])
        )
      ).split("=");
      newParams.set(signed[0], signed[1]);
    }
    url.search = newParams.toString();
    return Signer.__replaceUrlCharacters(url.toString());
  }

  /**
   * Signs input name.
   *
   * @param {string} name Name of the input element.
   * @param {string} code Product code.
   * @param {string} parentCode Parent product code.
   * @param {string|number} value Input value.
   * @returns {Promise<string>} the signed input name.
   */
  async signName(name, code, parentCode = "", value) {
    name = name.replace(/ /g, "_");
    const signature = await this.__signProduct(code + parentCode, name, value);
    const encodedName = encodeURIComponent(name);
    return Signer.__buildSignedName(encodedName, signature, value);
  }

  /**
   * Signs input value.
   *
   * @param {string} name Name of the input element.
   * @param {string} code Product code.
   * @param {string} parentCode Parent product code.
   * @param {string|number} value Input value.
   *
   * @returns {Promise<string>} the signed value.
   */
  async signValue(name, code, parentCode = "", value) {
    name = name.replace(/ /g, "_");
    const signature = await this.__signProduct(code + parentCode, name, value);
    return Signer.__buildSignedValue(signature, value);
  }

  /**
   * Signs a product composed of code, name and value.
   *
   * @param {string} code of the product.
   * @param {string} name name of the product.
   * @param {string} value of the product.
   * @returns {Promise<string>} the signed product.
   * @private
   */
  async __signProduct(code, name, value) {
    return await this.hmac.sign(code + name + Signer.__valueOrOpen(value));
  }

  /**
   * Signs a single query argument to be used in `GET` requests.
   *
   * @param name of the argument.
   * @param code of the product.
   * @param value of the argument.
   * @returns the signed query argument.
   * @private
   */
  async __signQueryArg(name, code, value) {
    name = name.replace(/ /g, "_");
    code = code.replace(/ /g, "_");
    const signature = await this.__signProduct(code, name, value);
    const encodedName = encodeURIComponent(name).replace(/%20/g, "+");
    const encodedValue = encodeURIComponent(
      Signer.__valueOrOpen(value)
    ).replace(/%20/g, "+");
    return Signer.__buildSignedQueryArg(encodedName, signature, encodedValue);
  }

  /**
   * Signs an input element.
   *
   * @param {HTMLInputElement} el the input element
   * @returns {Promise<HTMLInputElement>}the signed element
   */
  async signInput(el) {
    const name = el.getAttribute("name");
    if (!name) return el;
    const namePrefix = Signer.__splitNamePrefix(name);
    const nameString = namePrefix[1];
    const prefix = namePrefix[0];
    const code = this.__codes[prefix] ? this.__codes[prefix].code : null;
    if (!code) {
      return el;
    }
    const parentCode = this.__codes[prefix].parent;
    const value = el.value;
    const signedName = await this.signName(nameString, code, parentCode, value);
    el.setAttribute("name", prefix + ":" + signedName);
    return el;
  }

  /**
   * Signs a texArea element.
   *
   * @param {HTMLTextAreaElement} el the textArea element.
   * @returns {Promise<HTMLTextAreaElement>} the signed textarea element.
   */
  async signTextArea(el) {
    return this.signInput(el);
  }

  /**
   * Sign an option element.
   * Signatures are added to the value attribute on options.
   * This function may also be used to sign radio buttons.
   *
   * @param {HTMLOptionElement|HTMLInputElement} el the option element to be signed.
   * @returns {Promise<HTMLOptionElement|HTMLInputElement>}the signed option element.
   */
  async signOption(el) {
    // Get the name parameter, either from the "select"
    // parent element of an option tag or from the name
    // attribute of the input element itself
    let n = el.name;
    if (n === undefined) {
      const p = el.parentElement;
      n = p.name;
    }
    const namePrefix = Signer.__splitNamePrefix(n);
    const nameString = namePrefix[1];
    const prefix = namePrefix[0];
    const code = this.__codes[prefix] ? this.__codes[prefix].code : null;
    if (!code) {
      return el;
    }
    const parentCode = this.__codes[prefix].parent;
    const value = el.value;
    const signedValue = await this.signValue(
      nameString,
      code,
      parentCode,
      value
    );
    el.setAttribute("value", prefix + ":" + signedValue);
    return el;
  }

  /**
   * Signs a radio button. Radio buttons use the value attribute to hold their signatures.
   *
   * @param {HTMLInputElement} el the radio button element.
   * @returns {Promise<HTMLInputElement>} the signed radio button.
   */
  signRadio(el) {
    return this.signOption(el);
  }

  /**
   * Splits a string using the prefix pattern for foxy store.
   * The prefix pattern allows for including more than a single product in a given GET or POST request.
   *
   * @param {string} name the name to be separated into prefix and name.
   * @returns {Array} an array with [prefix, name]
   * @private
   */
  static __splitNamePrefix(name) {
    const namePrefix = name.split(":");
    if (namePrefix.length === 2) {
      return [parseInt(namePrefix[0], 10), namePrefix[1]];
    }
    return [0, name];
  }

  /**
   * Builds the value for the signed "name" attribute value given it components.
   *
   * @param {string} name that was signed
   * @param {string} signature the resulting signature
   * @param {string|number} value of the field that, if equal to --OPEN-- identifies an editable field.
   * @returns {string} the signed value for the "name" attribute
   * @private
   */
  static __buildSignedName(name, signature, value) {
    const open = Signer.__valueOrOpen(value) === "--OPEN--" ? "||open" : "";
    return `${name}||${signature}${open}`;
  }

  /**
   * Builds a signed name given it components.
   *
   * @param {string} signature the resulting signature.
   * @param {string|number} value the value signed.
   * @returns {string|number} the built signed value
   * @private
   */
  static __buildSignedValue(signature, value) {
    const open = Signer.__valueOrOpen(value) === "--OPEN--" ? "||open" : value;
    return `${open}||${signature}`;
  }

  /**
   * Builds a signed query argument given its components.
   *
   * @param {string} name the argument name.
   * @param {string} signature the resulting signature.
   * @param {string|number} value the value signed.
   * @returns {string} the built query string argument.
   * @private
   */
  static __buildSignedQueryArg(name, signature, value) {
    return `${name}||${signature}=${value}`;
  }

  /**
   * Returns the value of a field on the `--OPEN--` string if the value is not defined.
   * Please, notice that `0` is an acceptable value.
   *
   * @param {string|number|undefined} value of the field.
   * @returns {string|number} '--OPEN--' or the given value.
   * @private
   */
  static __valueOrOpen(value) {
    if (value === undefined || value === "") {
      return "--OPEN--";
    }
    return value;
  }

  /**
   * Check if a href string is already signed. Signed strings contain two consecutive pipes
   * followed by 64 hexadecimal characters.
   *
   * This method **does not validates the signature**.
   * It only checks if the format of the string is evidence that it is signed.
   *
   * @param {string} url the potentially signed URL.
   * @returns {boolean} true if the string format is evidence that it is already signed.
   * @private
   */
  static __isSigned(url) {
    return url.match(/^.*\|\|[0-9a-fA-F]{64}/) != null;
  }

  /**
   * Returns the code from a URL or undefined if it does not contain a code.
   *
   * @param {URL} url the URL to retrieve the code from.
   * @returns {string} the code found, or undefined if no code was found.
   * @private
   */
  static __getCodeFromURL(url) {
    for (const p of Array.from(url.searchParams)) {
      if (p[0] === "code") {
        return p[1];
      }
    }
  }

  /**
   * Replace some of the characters encoded by `encodeURIComponent()`.
   *
   * @param {string} urlStr the URL string.
   * @returns {string} a cleaned URL string.
   * @private
   */
  static __replaceUrlCharacters(urlStr) {
    return urlStr
      .replace(/%7C/g, "|")
      .replace(/%3D/g, "=")
      .replace(/%2B/g, "+");
  }

}
