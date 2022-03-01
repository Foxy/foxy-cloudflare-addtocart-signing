# Foxy Cloudflare Worker: Add-to-cart Signer

## Overview

This Cloudflare Worker generates [HMAC product verification](https://wiki.foxycart.com/v/2.0/hmac_validation) on [the edge](https://www.cloudflare.com/learning/serverless/glossary/what-is-edge-computing/).

It allows you to generate HMAC verified forms and links for your static pages or pages hosted in third party services, provided you control the domain.

A simple explanation so you know what to expect: you will prepare your website without any hmac signing, deploy the script to Cloudflare as a cloudflare worker, and set up your store's web page in Cloudflare to use the worker. Once this is done, the script will act on your site to cryptographically sign the links and re-render the page with the signed add-to-carts.

## Usage

- Prepare your website.
- Fork this repository.
- Configure your client secret using GitHub secrets.
- Deploy to Cloudflare Workers with one click using the GitHub action.
- Configure your store to use Cart Validation

### Prepare your website

To reduce issues with edge cases, we recommend that you follow these instructions precisely on how to format your form inputs and/or links.

- Check to ensure that your forms/links have a `code` input/parameter.
- `<a>` elements should not contain line breaks
- Plus signs (+) in product names for links will not currently work. We are working on supporting this. You may use spaces in the name for an add-to-cart link
- Ensure that there are no extra spaces at the end of form values, for example:
`<input type="hidden" name="name" value="Blue Shirt "/>`
will not sign properly
- There may be other cases not accounted for here. If you find that your add-to-carts aren't signing properly, please reach out to us.
- Ensure that the `<form>` element `action` attribute value contains the proper URL with `/cart` appended and no extra characters.

Here is an example add-to-cart using a link:

```html
<a href="https://YOURCARTDOMAIN.foxycart.com/cart?name=ProductName&code=741&price=19.99">Buy product</a>
```

Notice that you don't need to change anything in your website if you are already using a `code` attribute and are following the other requirements listed above.

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
| `FX_CLIENT_ID` | This is your Foxy client_id generated from the Integrations page of the Foxy admin. This is used to authenticate to your store to get API access tokens.
| `FX_CLIENT_SECRET` | This is your Foxy client_secret. This is used to authenticate to your store to get API access tokens.
| `FX_REFRESH_TOKEN` | This is your Foxy refresh token. This is used to authenticate to your store to get API access tokens.|

If you didn't fork the repository you can use `wrangler secret` to configure your `FX_CLIENT_SECRET`.

### Deploy to Cloudflare Workers

If you forked this repository, simply click the Actions page, then click the "Deploy to Cloudflare Workers" workflow and run it under "Run workflow".

If you are using wrangler, use `wrangler config` to set your account details, `wrangler secret` to configure your secrets and `wrangler publish` to deploy your worker.

### Add the Store Secret Environment Variable to the Cloudflare Worker
Go to the worker's Environment Variables and add a variable called `STORE_SECRET` with the value as the store secret from the advanced settings of your Foxy admin.

#### Configure your website in Cloudflare to use the worker

With your Cloudflare Worker Deployed you can now configure your website to use this webworker.

- Go to your Cloudflare account and choose your website.
- Click on "Workers" and then on "Add route".
- Fill the routes you want the worker to act upon and choose the worker.

### Configure your store to use Cart Validation

Now that your worker is active you need to configure your store to validate the cart.

- Go to your Foxy.io account.
- Under **Store**, click **advanced**
- Check the **Would you like to enable cart validation?** box and click on **Update Advanced Features**.

# Development

- Install wrangler
- Create your development version of the `wrangler.toml` file
- Set your `account_id` and run `wrangler config`

### Manual testing

Use `wrangler dev --env FX_CLIENT_SECRET=foo` to test the worker locally.

Use `wrangler preview -c dev.wrangler.toml` to start an environment with your worker running on any website.
