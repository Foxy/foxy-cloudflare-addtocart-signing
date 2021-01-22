/**
 * Cart Excludes
 *
 * Arrays of values and prefixes that should be ignored when signing links and forms.
 * @var array
 */
export const cart_excludes = [
  // Analytics values
  "_",
  "_ga",
  "_ke",
  // Cart values
  "cart",
  "fcsid",
  "empty",
  "coupon",
  "output",
  "sub_token",
  "redirect",
  "callback",
  "locale",
  "template_set",
  // Checkout pre-population values
  "customer_email",
  "customer_first_name",
  "customer_last_name",
  "customer_address1",
  "customer_address2",
  "customer_city",
  "customer_state",
  "customer_postal_code",
  "customer_country",
  "customer_phone",
  "customer_company",
  "billing_first_name",
  "billing_last_name",
  "billing_address1",
  "billing_address2",
  "billing_city",
  "billing_postal_code",
  "billing_region",
  "billing_phone",
  "billing_company",
  "shipping_first_name",
  "shipping_last_name",
  "shipping_address1",
  "shipping_address2",
  "shipping_city",
  "shipping_state",
  "shipping_country",
  "shipping_postal_code",
  "shipping_region",
  "shipping_phone",
  "shipping_company",
];

export const cart_excludes_prefixes = ["h:", "x:", "__", "utm_"];
