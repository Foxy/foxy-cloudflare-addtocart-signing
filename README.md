# Foxy Cloudflare Worker: Add-to-cart Signer

## Overview

This Cloudflare Worker generate [HMAC product verification](https://wiki.foxycart.com/v/2.0/hmac_validation) on the edge.

It allows you to generate HMAC verified forms and links for your static pages or pages hosted in third party services.


## Usage

- Prepare your website.
- Fork this repository.
- Configure your client secret using GitHub secrets.
- Deploy to Cloudflare Workers with one click using the GitHub action.

### Prepare your website

The only extra step you may need to do to use HMAC validation is to add a `code` attribute to your products.

Here is an example using a link:

```html
<a
  href="https://YOURCARTDOMAIN.foxycart.com/cart?name=ProductName&code=741&price=19.99"
  >Buy product</a
>
```

Notice that you don't need to change anything in your website if you are already using a `code` attribute.

### Fork this repository

Forking the repository will allow you to keep your worker up-to-date when new versions come along and will allow you to publish your worker without installing anything on your machine.

Click the **fork** button in the top right corner of this page.

You will create your own copy of this repository.
This will allow you to use GitHub Actions to publish your worker with a single click.

#### Can I use it without forking?

Sure! If you are familiar with cloudflare workers, you can use [`wrangler publish`](https://developers.cloudflare.com/workers/cli-wrangler) to publish your worker without the need to fork this repo.

### Configure your store secrets

If you forked this repository, go to the **settings** tab and then to the **secrets** link. 

There you will be able to set your secrets.

Using the "New secret" button create the following secrets:

| Secret             | Description                                                                                                                                                                                                                                                                                                                                    |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CF_ACCOUNT_ID`    | This is your Cloudflare Id. To get your ID, click the "Menu" next to Cloudflare's logo and, under "Products", click Workers. Your Client ID will be on the right sidebar. [How to get my Cloudflare Id](https://developers.cloudflare.com/workers/learning/getting-started#6a-obtaining-your-account-id-and-zone-id)                           |
| `CF_API_TOKEN`     | This is your API token. Click the "API Tokens" tab. Select an appropriate token or create a new one. If you'll use an existing, on the rightmost menu choose "Roll" and copy the token. [How to get my Cloudflare API token](https://developers.cloudflare.com/workers/learning/getting-started#option-1-obtaining-your-api-token-recommended) |
| `FX_CLIENT_SECRET` | This is your Foxy client secret. This is used to authenticate to your store to get access tokens.                                                                                                                                                                                                                                              |

If you didn't fork the repository you can use `wrangler secret` to configure your `FX_CLIENT_SECRET`.

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
