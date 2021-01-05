import {describe, it} from 'mocha';
import {CodeDictBuilder} from '../src/CodeBuilder.js';
import {JSDOM} from 'jsdom';
import pkg from 'chai';
const {expect} = pkg;

describe("Builds a cache of product codes within HTML document", () => {


  describe ("Finds prefixed codes", () => {
    it("finds prefixed codes", () => {
      const  shouldFind = [
        `<input name="1:code" value="foobar">`,
        `<input name="1:CoDe" value="foobar">`, // Attribute names are case-insensitive/always lower case
        `<input value="foobar" name="1:code">`,
      ];
      for (let i of shouldFind) {
        const codeBuilder = new CodeDictBuilder();
        const dom = new JSDOM(i);
        codeBuilder.element(dom.window.document.querySelector('input'));
        expect(codeBuilder.codes).to.deep.equal({
          1: {
            code: 'foobar'
          }
        });
      }
    });

    it("does not find funny codes", () => {
      const shouldNotFind = [
        `<input name="1:cod" value="foobar">`,
        `<input name=":CoDe" value="foobar">`, // Attribute names are case-insensitive/always lower case
        `<input name="1:ode">`,
        `<input name="code:1">`,
        `<input value="foobar">`,
      ];
      for (let i of shouldNotFind) {
        const codeBuilder = new CodeDictBuilder();
        const dom = new JSDOM(i);
        codeBuilder.element(dom.window.document.querySelector('input'));
        expect(codeBuilder.codes).to.deep.equal({});
      }
    });

  });

  it ("Finds un-prefixed codes", () => {
    const  shouldFind = [
      `<input name="code" value="foobar">`,
      `<input name="CoDe" value="foobar">`, // Attribute names are case-insensitive/always lower case
      `<input value="foobar" name="code">`,
    ];
    for (let i of shouldFind) {
      const codeBuilder = new CodeDictBuilder();
      const dom = new JSDOM(i);
      codeBuilder.element(dom.window.document.querySelector('input'));
      expect(codeBuilder.codes).to.deep.equal({
        0: {
          code: 'foobar'
        }
      });
    }
  });

  it ("Finds prefixed parent codes", () => {
    const  shouldFind = [
      `<input name="1:parent_code" value="foobar">`,
      `<input name="1:PaReNt_CoDe" value="foobar">`, // Attribute names are case-insensitive/always lower case
      `<input value="foobar" name="1:parent_code">`,
    ];
    for (let i of shouldFind) {
      const codeBuilder = new CodeDictBuilder();
      const dom = new JSDOM(i);
      codeBuilder.element(dom.window.document.querySelector('input'));
      expect(codeBuilder.codes).to.deep.equal({
        1: {
          parent_code: 'foobar'
        }
      });
    }
  });

  it ("Finds un-prefixed parent codes", () => {
    const  shouldFind = [
      `<input name="parent_code" value="foobar">`,
      `<input name="PaReNt_CoDe" value="foobar">`, // Attribute names are case-insensitive/always lower case
      `<input value="foobar" name="parent_code">`,
    ];
    for (let i of shouldFind) {
      const codeBuilder = new CodeDictBuilder();
      const dom = new JSDOM(i);
      codeBuilder.element(dom.window.document.querySelector('input'));
      expect(codeBuilder.codes).to.deep.equal({
        0: {
          parent_code: 'foobar'
        }
      });
    }
  });

  it ("Overwrites duplicate code", () => {
    const  shouldFind = [
      `<input name="parent_code" value="foobar">`,
      `<input name="PaReNt_CoDe" value="foobar">`,
      `<input value="baz" name="parent_code">`,
      `<input name="1:parent_code" value="foobar">`,
      `<input name="1:PaReNt_CoDe" value="foobar">`,
      `<input value="baz" name="1:parent_code">`
    ];
    const codeBuilder = new CodeDictBuilder();
    for (let i of shouldFind) {
      const dom = new JSDOM(i);
      codeBuilder.element(dom.window.document.querySelector('input'));
    }
    expect(codeBuilder.codes).to.deep.equal({
      0: {
        parent_code: 'baz'
      },
      1: {
        parent_code: 'baz'
      }
    });
  });

} );
