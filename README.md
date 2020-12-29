# Foxy Cloudflare Worker: Add-to-cart Signer

## Overview

This worker uses [Foxy SDK](https://github.com/Foxy/foxy-sdk) to generate [HMAC product verification](https://wiki.foxycart.com/v/2.0/hmac_validation) on the edge.

This allows you to generate HMAC verified forms and links for your static pages or pages hosted in third party services.

## Usage

- Prepare your website.
- Fork this repository.
- Configure your client secret using GitHub secrets.
- Deploy to Cloudflare Workers with one click using the GitHub action.

### Prepare your website

The only possible extra step you may need to do to use HMAC validation is to add a `code` attribute to your products.

If you have already set this attribute, you do not need to change anything in your existing store to use this worker.

Here is an example using a link:

```html
<a
  href="https://YOURCARTDOMAIN.foxycart.com/cart?name=ProductName&code=741&price=19.99"
  >Buy product</a
>
```

### Fork this repository

Click the fork button in the top right corner of this page.

You will create your own copy of this repository.
This will allow you to use GitHub Actions to publish your worker with a single click.

If you are familiar with cloudflare workers, you can use `wrangler publish` to publish your worker without the need to fork this repo.

### Configure your store secrets

If you forked this repository, go to the **settings** tab and then to the **secrets** link.

There you will be able to set your secrets.

Using the "New secret" button create the following secrets:

| Secret             | Description                                                                                                                                                                                                                                                                                                                                    |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CF_ACCOUNT_ID`    | This is your Cloudflare Id. To get your ID, click the "Menu" next to Cloudflare's logo and, under "Products", click Workers. Your Client ID will be on the right sidebar. [How to get my Cloudflare Id](https://developers.cloudflare.com/workers/learning/getting-started#6a-obtaining-your-account-id-and-zone-id)                           |
| `CF_API_TOKEN`     | This is your API token. Click the "API Tokens" tab. Select an appropriate token or create a new one. If you'll use an existing, on the rightmost menu choose "Roll" and copy the token. [How to get my Cloudflare API token](https://developers.cloudflare.com/workers/learning/getting-started#option-1-obtaining-your-api-token-recommended) |
| `FX_CLIENT_SECRET` | This is your Foxy client secret. This is used to authenticate to your store to get access tokens.                                                                                                                                                                                                                                              |

### Deploy to Cloudflare Workers

If you forked this repository, simply click the Actions page, then click the "Deploy to Cloudflare Workers" workflow and run it under "Run workflow".

If you are using wrangler, use `wrangler config` to set your account details, `wrangler secret` to configure your secrets and `wrangler publish` to deploy your worker.

# Development

- Install wrangler
- Create your development version of the `wrangler.toml` file
- Set your `account_id` and run `wrangler config`

### Manual testing

Use `wrangler dev --env FX_CLIENT_SECRET=foo` to test the worker locally.

Use `wrangler preview -c dev.wrangler.toml` to start an environment with your worker running on any website.