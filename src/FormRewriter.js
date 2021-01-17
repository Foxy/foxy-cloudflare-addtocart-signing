export class FormRewriter {
  /**
   * @param {Signer} signer that will be used to sign form items.
   */
  constructor(signer) {
    this.signer = signer;
  }

  async element(el) {
    el.innerHTML = this.signer.signForm(el.innerHTML);
  }

}
