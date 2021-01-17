/**
 * CodeDictBuilder fills a CodesDict Object.
 *
 * Elements with a attribute name ending with "code" are used to build an object with prefixes, codes and parent code.
 * This object can be used to find the parent code of a code without the need to search for the parent code element.
 */
export class CodeDictBuilder {
  constructor(codesDict, queue, queue_action) {
    this.codes = codesDict ? codesDict: {};
    this.queue = queue ? queue: {};
    this.action = queue_action;
  }

  element(el) {
    const nameAttr = el.getAttribute("name");
    const codeValue = el.getAttribute("value");
    if (nameAttr && nameAttr.match(/^([0-9]{1,3}:)?(parent_)?code/i) && codeValue) {
      const namePrefix = nameAttr.split(":");
      let prefix;
      let name;
      if (namePrefix.length === 2) {
        prefix = namePrefix[0];
        name = namePrefix[1].toLowerCase();
      } else {
        prefix = 0;
        name = namePrefix[0].toLowerCase();
      }
      if (!this.codes[prefix]) this.codes[prefix] = {};
      this.codes[prefix][name] = codeValue;
    }
  }
}
