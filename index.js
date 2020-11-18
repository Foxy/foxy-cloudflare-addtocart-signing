let token;

/**
 * @typedef {Object} Token
 * @property {string} access_token - The access_token value
 * @property {number} expires_in - The number in seconds from now when the token will expire
 * @property {string} token_type - The token type. For this application it should be always "Bearer"
 * @property {string} scope - The token scope: the token permission and token store
 */

/** Cloudflare Worker method */
addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

/**
 * Handles the request
 *
 * @param {Request} request to be handled
 * @returns {Response|Promise<Response>} response
 */
async function handleRequest(request) {
  const now = new Date().getTime();
  // Avoid fetching the access token if it is valid.
  if (!token || now > token.goodUntil) {
    // fetch a new token
    const newToken = await refreshToken();
    // cache the new token
    token = { ...newToken, goodUntil: now + newToken.expires_in * 1000 };
  }
  if (token) {
    try {
      const originalResponse = await fetch(request);
      const originalHTML = await originalResponse.text();
      const signedHTML = await signHTML(originalHTML);
      return new Response(signedHTML, originalResponse);
    } catch (e) {
      console.error("Error signing HTML", e);
      return fetch(request); // Unaltered
    }
  } else {
    return fetch(request); // Unaltered
  }
}

/**
 * Refreshes the access_token
 *
 * @returns {Token} the retrieved token
 */
async function refreshToken() {
  // Build headers
  const headers = new Headers();
  headers.append("FOXY-API-VERSION", "1");
  headers.append(
    "Authorization",
    `Basic ${btoa(`${FX_CLIENT_ID}:${FX_CLIENT_SECRET}`)}`
  );
  // Build body
  const formData = new FormData();
  formData.append("grant_type", "refresh_token");
  formData.append("refresh_token", FX_REFRESH_TOKEN);
  // Build options
  const requestOptions = {
    body: formData,
    headers: headers,
    method: "POST",
    redirect: "follow",
  };
  // Fetch
  const response = await fetch(
    "https://api.foxycart.com/token",
    requestOptions
  );
  return await response.json();
}

/**
 * Signs an HTML string
 *
 * @param {string} htmlToSign - the html string that will be signed by the API
 * @returns {Promise<string>} result - a promise for the signed HTML
 */
async function signHTML(htmlToSign) {
  // Build headers
  const headers = new Headers();
  headers.append("FOXY-API-VERSION", "1");
  headers.append("Authorization", `Bearer ${token.access_token}`);
  // Build options
  const requestOptions = {
    body: htmlToSign,
    headers: headers,
    method: "POST",
    redirect: "follow",
  };
  // Fetch
  const response = await fetch(
    "https://api.foxycart.com/encode",
    requestOptions
  );
  const result = await response.json();
  return result.result;
}
