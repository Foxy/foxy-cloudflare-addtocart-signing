/**
 * CodeDictBuilder fills a CodesDict Object.
 *
 * Elements with a attribute name ending with "code" are used to build an object with prefixes, codes and parent code.
 * This object can be used to find the parent code of a code without the need to search for the parent code element.
 */
export class CodeDictBuilder {
  constructor(codesDict) {
    this.codes = codesDict ? codesDict: {};
  }

  element(el) {
    const nameAttr = el.getAttribute("name");
    const codeValue = el.getAttribute("value");
    if (nameAttr && nameAttr.match(/^([0-9]{1,3}:)?(parent_)?code/i) && codeValue) {
      const namePrefix = nameAttr.split(":");
      const prefix = namePrefix[0];
      if (namePrefix.length === 2) {
        const codeType = namePrefix[1].toLowerCase(); // parent_code or code
        // Store prefix in codes list
        if (!this.codes[prefix]) this.codes[prefix] = {};
        this.codes[prefix][codeType] = codeValue;
      } else {
        if (!this.codes[0]) this.codes[0] = {};
        // Allow to push a single code without prefix
        this.codes[0][nameAttr.toLowerCase()] = codeValue;
      }
    }
  }
}
