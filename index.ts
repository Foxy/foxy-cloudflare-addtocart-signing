declare const STORE_SECRET: string;

import { Signer } from "./src/Signer";
import { Hmac } from "./src/Hmac";

/**
 * Handles the request
 *
 * @param {Request} req to be handled
 * @returns {Response|Promise<Response>} response
 */
async function handleRequest(req) {
  if (!STORE_SECRET) return fetch(req);
  const secret = STORE_SECRET;
  const signer = new Signer(new Hmac(secret));
  const res = await fetch(req);
  const responseBody = await signer.signHtml(await res.text());
  return new Response(responseBody, res);
}

addEventListener("fetch", (event: FetchEvent) => {
  event.respondWith(handleRequest(event.request));
});
