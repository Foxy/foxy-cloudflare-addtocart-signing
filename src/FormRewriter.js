export class FormRewriter {
  /**
   * @param {Signer} signer that will be used to sign form items.
   */
  constructor(signer) {
    this.signer = signer;
  }

  async element(el) {
    switch (el.tagName.toLowerCase()) {
      case "input":
        if (el.getAttribute("type") === "radio")
          await this.signer.signRadio(el);
        else await this.signer.signInput(el);
        break;
      case "option":
        await this.signer.signOption(el);
        break;
      case "textarea":
        await this.signer.signTextArea(el);
        break;
    }
  }
}
