import * as buffer from "buffer";
import { cart_excludes, cart_excludes_prefixes } from "./excludes";

interface Product {
  matched: string;
  prefix: string;
  code: string;
  parentCode: string;
}

interface HMACInterface {
  sign: (s: string) => Promise<Buffer>;
}

/**
 * Return a list of matched groups.
 *
 * Each group contains all the values set in the groups plus a "match" value containing the string that was matched.
 *
 * @param str The subject string
 * @param regexp pattern to match
 * @returns a list of matched groups with key value pairs
 */
function matchGroups(str: string, regexp: RegExp): Record<string, string>[] {
  let match;
  const found = [];
  while ((match = regexp.exec(str)) !== null) {
    if (match.groups) {
      match.groups.matched = match[0];
      found.push(match.groups);
    }
  }
  return found;
}

function strContains(
  haystack: string,
  needle: string,
  offset: number = 0
): boolean {
  const i = (haystack + "").indexOf(needle, offset || 0);
  return i !== -1;
}

/**
 * Signer
 *
 * @author FoxyCart.com
 * @copyright FoxyCart.com LLC, 2011
 * @version 2.0.0.20171024
 * @license MIT http://opensource.org/licenses/MIT
 * @example http://wiki.foxycart.com/docs/cart/validation
 *
 * Requirements:
 *   - Form "code" values should not have leading or trailing whitespace.
 *   - Cannot use double-pipes in an input's name
 *   - Empty textareas are assumed to be "open"
 */
export class Signer {
  hmac: HMACInterface | undefined;

  protected log: string[] = [];

  /**
   * Constructs a Signer object.
   *
   * @param hmacEngine an HMAC signing class. It needs to have a sign method that returns a Promise to HMAC signature of a given message.
   */
  constructor(hmacEngine: HMACInterface) {
    this.hmac = hmacEngine;
  }

  __prefixRegex(prefix: string): string {
    return prefix == "0:" ? "(0:)?" : prefix;
  }

  private static __getCodesFromPairs(
    pairs: Record<string, string>[]
  ): Record<string, string> {
    // Get all the "code" values, set the matches in codes
    const codes: Record<string, string> = {};
    for (let pair of pairs) {
      if (!pair.prefix) pair.prefix = "0:";
      if (pair.name == "code") {
        codes[pair.prefix] = pair.value;
      }
    }
    for (let pair of pairs) {
      if (pair.name == "parent_code") {
        codes[pair.prefix] += pair.value;
      }
    }
    return codes;
  }

  private static __getParentCodeFromInputs(inputs: string[]) {
    // get parent codes if they exist and append them to our code
    for (let item of inputs) {
      if (strContains(item, "parent_code")) {
        const match = item.match(/value=(['"])(.*?)['"]/i);
        if (match) {
          return match[2];
        }
      }
    }
    return "";
  }

  private __getForms(html: string): string[] {
    const pattern = new RegExp(
      '<form [^>]*?action=[\'"][^"]*?' +
        this.cartPath +
        "(?:.php)?['\"].*?>.+?</form>",
      "isg"
    );
    const forms = html.match(pattern);
    return forms ? forms : [];
  }

  public __getQueryStrings(html: string): Record<string, string>[] {
    let pattern = new RegExp(
      "<a .*?href=['\"](?<domain>[^'\"]*?)" +
        this.cartPath +
        "(.php)??(?<query>.*?)['\"][^>]*?>",
      "gi"
    );
    return matchGroups(html, pattern);
  }

  private __getFormCodes(form: string): Product[] {
    const regex = new RegExp(
      "<[^>]*?name=['\"](?<prefix>[0-9]{1,3}:)?code['\"][^>]*?>",
      "ig"
    );
    const codes = matchGroups(form, regex);
    for (let group of codes) {
      const match = group.matched.match(/value=["'](.+)['"]/);
      group.code = match ? match[1] : "";
      if (group.prefix === undefined) {
        group.prefix = "0:";
      }
      group.parentCode = Signer.__getParentCodeFromInputs(
        this.__getInputsWithPrefix(form, group.prefix)
      );
    }
    return (codes as unknown) as Product[];
  }

  private __getInputsWithPrefix(form: string, prefix: string) {
    prefix = this.__prefixRegex(prefix);
    let pattern = new RegExp(
      "<input [^>]*?name=(['\"])" +
        this.__prefixRegex(prefix) +
        "(?![0-9]{1,3})(?:.+?)['\"][^>]*?>",
      "ig"
    );
    let match = form.match(pattern);
    return match ? match : [];
  }

  /**
   * Cart Path
   *
   * @var string
   * Notes: should be /cart . Notice that it does not includes the domain.
   **/
  protected cartPath: string = "/cart";

  protected static cart_excludes = cart_excludes;

  protected static cart_excludes_prefixes = cart_excludes_prefixes;

  public async signUrl(url: string): Promise<string> {
    if (strContains(url, "||")) {
      return url;
    }
    const pattern =
      "(?<protocol>https?://)(?<domain>[^?/]*?)" +
      this.cartPath +
      "(.php)?\\?(?<querystring>.*)";
    const match = url.match(pattern);
    if (!match || !match.groups) {
      return url;
    } else {
      return `${match.groups.protocol}${match.groups.domain}${
        this.cartPath
      }${await this.signQueryString(match.groups.querystring)}`;
    }
  }

  /**
   * "Link Method": Generate HMAC SHA256 for GET Query Strings
   *
   * Notes: Can't parse_str because PHP doesn't support non-alphanumeric characters as array keys.
   * @return string
   **/
  public async signQueryString(qs: string) {
    qs = qs.replace(/^\?/, "");
    const fail = "?" + qs;
    // If the link appears to be hashed already, don't bother
    if (strContains(qs, "||")) {
      return fail;
    }
    // Stick an ampersand on the beginning of the querystring to make matching the first element a little easier
    qs = "&" + qs;
    // Get all the prefixes, codes, and name=value pairs
    const pairs = matchGroups(
      qs,
      /(?<amp>&(?:amp;)?)(?<prefix>[a-z0-9]{1,3}:)?(?<name>[^=]+)=(?<value>[^&]+)/g
    );
    // Get all the "code" values, set the matches in codes
    const codes = Signer.__getCodesFromPairs(pairs);
    if (!Object.keys(codes).length) {
      return fail;
    }
    // Sign the name/value pairs
    for (let pair of pairs) {
      if (this.__shouldSkipInput(pair["prefix"] + pair["name"])) {
        continue;
      }
      // Continue to sign the value and replace the name=value in the querystring with name=value||hash
      const value = await this.signName(
        codes[pair["prefix"]],
        decodeURI(pair["name"]),
        decodeURI(pair["value"]),
        "value",
        true
      );
      let replacement: string;
      if (decodeURI(pair["value"]) == "--OPEN--") {
        replacement = pair["amp"] + value + "=";
      } else {
        replacement =
          pair["amp"] + pair["prefix"] + encodeURI(pair["name"]) + "=" + value;
      }
      qs = qs.replace(pair.matched, replacement);
      this.log.push(
        "Signed <strong>" +
          pair["name"] +
          "</strong> = <strong>" +
          pair["value"] +
          "</strong> with " +
          replacement +
          ".<br />Replacing: " +
          pair[0] +
          "<br />With... " +
          replacement
      );
    }
    qs = qs.replace(/^&/, ""); // Get rid of that leading ampersand we added earlier
    return "?" + qs;
  }

  /**
   * "Form Method": Generate HMAC SHA256 for form elements or individual <input />s
   *
   * @return string
   **/
  public async signName(
    product_code: string,
    option_name: string,
    option_value = "",
    method = "name",
    urlEncode = false
  ) {
    if (!product_code || !option_name) {
      return false;
    }
    option_name = option_name.replace(" ", "_");
    let hash;
    let value;
    if (option_value == "--OPEN--") {
      hash = await this.hmac!.sign(
        `${product_code}${option_name}${option_value}`
      );
      value = urlEncode
        ? `${encodeURI(option_name)}||${hash}||open`
        : `${option_name}||${hash}||open`;
    } else {
      hash = await this.hmac!.sign(
        `${product_code}.${option_name}.${option_value}`
      );
      if (method == "name") {
        value = urlEncode
          ? `${encodeURI(option_name)}||${hash}`
          : `${option_name}||${hash}`;
      } else {
        value = urlEncode
          ? `${encodeURI(option_value)}||${hash}`
          : `${option_value}||${hash}`;
      }
    }
    return value;
  }

  private __shouldSkipInput(name: string): boolean {
    const prefixStripped = name.replace(/^\d:/, "");
    return (
      Signer.cart_excludes.includes(prefixStripped) ||
      Signer.cart_excludes_prefixes.some((p) =>
        name.toLowerCase().startsWith(p)
      )
    );
  }

  private async __signInputs(html: string, code: Product) {
    const inputs = this.__getInputsWithPrefix(html, code.prefix);
    for (let input of inputs) {
      const signed = await this.__getSignedInput(input, code);
      html = html.replace(input, signed);
    }
    return html;
  }

  /**
   *
   * @param html string containing a form with option elements
   * @param code a Product that will have its options signed
   * @returns html a modified HTML snippet with the option fields signed
   * @private
   */
  private async __signOptions(html: string, code: Product): Promise<string> {
    let pattern = new RegExp(
      "<select [^>]*name=['\"]" +
        this.__prefixRegex(code.prefix) +
        "(?![0-9]{1,3})(?<name>.+?)['\"][^>]*>(?<children>.+?)</select>",
      "isg"
    );
    let selects = matchGroups(html, pattern);
    let signedSelect = "";
    for (let select of selects) {
      // Skip the cart excludes
      if (this.__shouldSkipInput(code.prefix + select.name)) {
        continue;
      }
      let options = matchGroups(
        select.children,
        /<option [^>]*value=(?<quote>['"])(?<value>.*?)['"][^>]*>(?:.*?)<\/option>/g
      );
      signedSelect = select.matched;
      for (let option of options) {
        if (!option.value) {
          continue;
        }
        const option_signed = option.matched.replace(
          option.quote + option.value + option.quote,
          option.quote +
            (await this.signName(
              code.code + code.parentCode,
              select.name,
              option.value,
              "value",
              false
            )) +
            option.quote
        );
        signedSelect = signedSelect.replace(option.matched, option_signed);
      }
      html = html.replace(select.matched, signedSelect);
    }
    return html;
  }

  private async __signTextAreas(html: string, code: Product): Promise<string> {
    let pattern = new RegExp(
      "<textarea [^>]*name=['\"]" +
        code.prefix +
        "(?![0-9]{1,3})(?<name>)(.+?)['\"][^>]*>(?<value>.*?)</textarea>",
      "isg"
    );
    for (let textarea of matchGroups(html, pattern)) {
      // Skip the cart excludes
      if (this.__shouldSkipInput(code.prefix + textarea.name)) {
        continue;
      }
      // Tackle implied "--OPEN--" first, if textarea is empty
      textarea.value = textarea.value == "" ? "--OPEN--" : textarea.value;
      pattern = new RegExp(
        "name=(['\"])" + code.prefix + textarea.name + "['\"]"
      );
      const textarea_signed = textarea.matched.replace(
        pattern,
        "name=$1" +
          (await this.signName(
            code.code + code.parentCode,
            textarea.name,
            textarea.value,
            "name",
            false
          )) +
          "$1"
      );
      html = html.replace(textarea[0], textarea_signed);
    }
    return html;
  }

  private async __getSignedInput(
    input: string,
    code: Product
  ): Promise<string> {
    // Test to make sure both name and value attributes are found
    let pattern;
    let input_signed = input;
    let match;
    const prefix = this.__prefixRegex(code.prefix);
    const matchedCode = code.code + code.parentCode;
    pattern = new RegExp(
      "name=['\"]" + prefix + "(?![0-9]{1,3})(?<name>.+?)['\"]",
      "i"
    );
    match = input.match(pattern);
    const name = match ? match.groups!.name : "";
    if (match) {
      match = input.match(/value=['"](.*?)['"]/);
      let value = match ? match : ["", "", ""];
      match = input.match(/type=['"](.*?)['"]/);
      let type = match ? match : ["", "", ""];
      // Skip the cart excludes
      if (this.__shouldSkipInput(prefix + name)) {
        return input;
      }
      value[1] = value[1] == "" ? "--OPEN--" : value[1];
      if (type[1] == "radio") {
        pattern = new RegExp("(['\"])" + value[1] + "['\"]");
        input_signed = input.replace(
          pattern,
          '"' +
            (await this.signName(matchedCode, name, value[1], "value", false)) +
            '"'
        );
      } else {
        pattern = new RegExp("name=(['\"])" + prefix + name + "['\"]");
        input_signed = input.replace(
          pattern,
          'name="' +
            code.prefix +
            (await this.signName(matchedCode, name, value[1], "name", false)) +
            '"'
        );
      }
    }
    return input_signed;
  }

  /**
   * Signs an entire HTML snippet form string.
   * All input and option fields within the form will be signed and the resulting HTML string is returned.
   *
   * It assumes the string contains only a single form.
   *
   * @param html the HTML string containing the form to be signed
   * @returns a Promise of a signed HTML snippet string containing the form
   */
  public async signForm(html: string): Promise<string> {
    // Store the original form so we can replace it when we're done
    const form_original = html;
    // Check for the "code" input, set the matches in $codes
    const codes = this.__getFormCodes(html);
    if (!codes.length) {
      return form_original;
    }
    // For each code found, sign the appropriate inputs
    for (let code of codes) {
      // If the code is empty, skip this form or specific prefixed elements
      if (!code.code) {
        continue;
      }
      // Sign all <input /> elements with matching prefix
      html = await this.__signInputs(html, code);
      // Sign all <option /> elements
      html = await this.__signOptions(html, code);
      // Sign all <textarea /> elements
      html = await this.__signTextAreas(html, code);
    }
    // Exclude all <button> elements
    html = html.replace(
      /<button ([^>]*)name=(['"])(.*?)['"]([^>]*>.*?<\/button>)/i,
      "<button $1name=$2x:$3$4"
    );
    // Replace the entire form
    return html.replace(form_original, html);
  }

  /**
   * Raw HTML Signing: Sign all links and form elements in a block of HTML
   *
   * Accepts a string of HTML and signs all links and forms.
   * Requires link 'href' and form 'action' attributes to use 'https' and not 'http'.
   * Requires a 'code' to be set in every form.
   *
   * @return string
   **/
  public async signHtml(html: string) {
    // Find and sign all the links
    const queryStrings = this.__getQueryStrings(html);
    for (let queryString of queryStrings) {
      if (strContains(queryString.matched, "||")) {
        continue;
      }
      const url = queryString.matched
        .replace(/href=['"]/, "")
        .replace(/['"]$/, "");
      const signed = await this.signUrl(
        `${queryString.domain}${this.cartPath}${queryString.query}`
      );
      const regex = new RegExp(
        `href=['"]${queryString.domain}${
          this.cartPath
        }(\.php)?.${queryString.query.replace(/^\?/, "")}['"]`
      );
      if (signed != url) {
        html = html.replace(regex, `href="${signed}"`);
      }
    }
    // Find and sign all form values
    const forms = this.__getForms(html);
    if (forms) {
      for (let form of forms) {
        html = html.replace(form, await this.signForm(form));
      }
    }
    return html;
  }
}
