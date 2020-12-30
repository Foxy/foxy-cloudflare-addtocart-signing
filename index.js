// global FX_CLIENT_SECRET
/**
 type CodesDict = {
  [key: number]: {
    code: string;
    parent: string;
  };
};
 **/

import { CodeDictBuilder } from './src/CodeBuilder'
import { FormRewriter } from './src/FormRewriter'
import { LinkRewriter } from './src/LinkRewriter'
import { Signer } from './src/Signer'


/**
 * Handles the request
 *
 * @param {Request} req to be handled
 * @returns {Response|Promise<Response>} response
 */
async function handleRequest(req) {
  if (!FX_CLIENT_SECRET) return fetch(req);
  const secret = FX_CLIENT_SECRET;
  const codes = {};
  const codeBuilder = new CodeDictBuilder(codes);
  const signer = new Signer(secret, codes);
  const formRewriter = new FormRewriter(signer);
  const linkRewriter = new LinkRewriter(signer);

  // Fill the codes object
  const rewriter = new HTMLRewriter()
    .on('form[action$="foxycart.com/cart"] [name$=code]', codeBuilder)
    .on('form[action$="foxycart.com/cart"] input', formRewriter)
    .on('form[action$="foxycart.com/cart"] select', formRewriter)
    .on('form[action$="foxycart.com/cart"] textarea', formRewriter)
    .on('a[href*="foxycart.com/cart"]', linkRewriter);
  const res = await fetch(req);
  return rewriter.transform(res);
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})
