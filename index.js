// global FX_CLIENT_SECRET

import { FormRewriter } from './src/FormRewriter'
import { LinkRewriter } from './src/LinkRewriter'
import { Signer } from './src/CartValidation/cart-validation.ts'

/**
 * Handles the request
 *
 * @param {Request} req to be handled
 * @returns {Response|Promise<Response>} response
 */
async function handleRequest(req) {
  if (!FX_CLIENT_SECRET) return fetch(req);
  const secret = FX_CLIENT_SECRET;
  const signer = new Signer(secret);
  const formRewriter = new FormRewriter(signer);
  const linkRewriter = new LinkRewriter(signer);

  // Fill the codes object
  const rewriter = new HTMLRewriter()
    .on('form[action$="/cart"]', formRewriter)
    .on('a[href*="/cart"]', linkRewriter);
  const res = await fetch(req);
  return rewriter.transform(res);
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

