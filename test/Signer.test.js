import { describe, it } from "mocha";
import { MockHmac } from "./mock/crypto.js";
import { Hmac } from "../src/Hmac.js";
import pkg from "chai";
import chaiAsPromised from "chai-as-promised";

pkg.use(chaiAsPromised);
const expect = pkg.expect;

describe("Mmac", () => {
  it("Cannot operate with an undefined secret", async () => {
    const hmac = new Hmac(undefined, {});
    expect(hmac.sign("message")).to.be.rejected;
  });

  it("Signs a simple message", async () => {
    const hmac = new Hmac("1", new MockHmac());
    const message = "foo";
    global.btoa = (s) => "b64 " + s;
    const signed = await hmac.sign(message);
    expect(signed).to.equal("b64 signed");
  });
});
