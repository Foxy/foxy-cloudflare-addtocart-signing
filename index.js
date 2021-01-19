// global FX_CLIENT_SECRET

import { Signer } from "./src/CartValidation/cart-validation.ts";
import { Hmac } from "./src/Signer";

/**
 * Handles the request
 *
 * @param {Request} req to be handled
 * @returns {Response|Promise<Response>} response
 */
async function handleRequest(req) {
  if (!FX_CLIENT_SECRET) return fetch(req);
  const secret = FX_CLIENT_SECRET;
  const signer = new Signer(new Hmac(secret));
  const res = await fetch(req);
  const responseBody = await signer.signHtml(await res.text());
  return new Response(responseBody, res);
}

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});
