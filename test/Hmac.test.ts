import "mocha";
import { MockHmac } from "./mock/crypto";
import { Hmac } from "../src/Hmac";
import pkg from "chai";
import chaiAsPromised from "chai-as-promised";

pkg.use(chaiAsPromised);
const expect = pkg.expect;

describe("Hmac", () => {
  it("Uses available crypt as cryptoEngine if none is provided", () => {
    expect(() => new Hmac("1")).to.throw("crypto is not defined");
  });

  it("Cannot operate with an undefined secret", async () => {
    // @ts-ignore
    const hmac = new Hmac("", {});
    expect(hmac.sign("message")).to.be.rejected;
  });

  it("Signs a simple message", async () => {
    // @ts-ignore
    const hmac = new Hmac("1", new MockHmac());
    const message = "foo";
    // @ts-ignore
    const signed = await hmac.sign(message);
    expect(signed).to.equal("7369676e6564");
  });
});
