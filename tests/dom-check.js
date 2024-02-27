const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const fs = require("fs");

const index = fs.readFileSync("./index.html", "utf-8");
const about = fs.readFileSync("./about/index.html", "utf-8");
const contact = fs.readFileSync("./contact/index.html", "utf-8");
const options = {
  includeNodeLocations: true, // preserves location info produced by the HTML parser
};

const indexDom = new JSDOM(index, options);
const aboutDom = new JSDOM(about, options);
const contactDom = new JSDOM(contact, options);

module.exports = {
  doms: [indexDom, aboutDom, contactDom],
  fileText: `\n------\nMAIN\n------\n ${index}\n\n\n------\nABOUT\n------\n ${about} \n\n\n------\nCONTACT\n------\n ${contact}`,
  INDEX: 0,
  ABOUT: 1,
  CONTACT: 2,
};
