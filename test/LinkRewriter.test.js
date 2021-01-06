import {JSDOM} from "jsdom";
import {LinkRewriter} from "../src/LinkRewriter.js";
import {MockHmac} from "./mock/crypto.js";
import {describe} from 'mocha';
import pkg from 'chai';

const {expect} = pkg;;


describe('Signs an HTML Anchor element', () => {
  it ('Signs the href attribute', async () => {
    const shouldSign = [
      `<a href="http://example.com">Foo Bar</a>`,
      `<a custom-attribute="foo" href="http://example.com" code="bar" name="baz">Foo Bar</a>`,
      `<a href="http://example.com"></a>`,
    ];
    for (let i of shouldSign) {
      const dom = new JSDOM(i);
      const rewriter = new LinkRewriter(new MockHmac(1, {}));
      const a = dom.window.document.querySelector('a');
      await rewriter.element(a);
      expect(a.getAttribute('href')).to.equal('signed');
    }
  });

  it ('Does not change any other attribute', async () => {
    const dom = new JSDOM(`<a custom-attribute="foo" title="foo" href="http://example.com" style="color: 'blue'">Foo Bar</a>`);
    const rewriter = new LinkRewriter(new MockHmac('1', {} ));
    const a = dom.window.document.querySelector('a');
    await rewriter.element(a);
    expect(a.getAttribute('custom-attribute')).to.equal('foo');
    expect(a.getAttribute('title')).to.equal('foo');
    expect(a.getAttribute('style')).to.equal("color: 'blue'");
  });
});
