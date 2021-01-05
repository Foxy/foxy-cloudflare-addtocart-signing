import { Signer } from "./Signer.js";

export class LinkRewriter {
  /**
   * @param {Signer} signer to be used to sign the URLs query params.
   */
  constructor(signer) {
    this.signer = signer;
  }

  async element(el) {
    el.setAttribute("href", await this.signer.signUrl(el.getAttribute("href")));
  }
}
