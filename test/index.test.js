import pkg from 'chai';
import {describe, it} from 'mocha';
import {Signer} from "../src/Signer.js";
import {MockHmac} from "./mock/crypto.js";
import {main} from './index.js';

const { expect } = pkg

describe("Signer", () => {
  const signer = new Signer("1", {0: {code: "1234"}, 1: {code: "5678"}, 2: {code: "9012"}}, new MockHmac());

  describe("Signs basic items", async () => {
    it("Signs an input name", async () => {
      main.handleRequest(null);
    });
  });
});