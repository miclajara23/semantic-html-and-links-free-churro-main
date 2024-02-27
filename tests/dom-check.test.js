const sizeOf = require("image-size");
const fs = require("fs");
const { doms, fileText, INDEX, ABOUT, CONTACT } = require("./dom-check.js");
//const { execPath } = require("process");
// const { type } = require("os");

/******* SETUP ******* */
const convertDocIndexToName = index =>
  index === INDEX
    ? "main"
    : index === ABOUT
    ? "about"
    : index === CONTACT
    ? "contact"
    : "unknown";

//TODO: check for missing files
// load doms in an array and add a name to each document for test.each()
const docs = doms.map((dom, i) => {
  return { dom: dom.window.document, name: convertDocIndexToName(i) };
});

//load CSS file once
// const css = fs.readFileSync("styles/main.css", "utf-8");

//  generating image info
const images = [];

// build the image array used by image tests
let imgs = [];
docs.forEach(doc => {
  const docImages = Array.from(doc.dom.querySelectorAll("img"));
  const docImagesIndex = docImages.map(img => {
    return { image: img, fileName: doc.name };
  });
  imgs = imgs.concat(docImagesIndex);
});

// don't check dimensions on SVG images or image filenames containing "hero"
const hero = new RegExp(/hero/);
const svg = new RegExp(/svg$/);

imgs.forEach(img => {
  //clean paths
  let hotlink = false;
  if (img.image.src.startsWith("http")) {
    hotlink = true;
  }
  let path = "";
  let dimensions = 0;

  if (!hotlink) {
    path = img.image.src.replace(/^..\//, "");
    dimensions = sizeOf(path);
  }

  // get image dimensions
  images.push({
    img: img.image,
    dimensions: dimensions,
    path: path,
    checkDimensions: !hero.test(path) && !svg.test(path),
    file: convertDocIndexToName(img.index),
    hotlink: hotlink,
  });
});

/******* TESTS ******* */
describe("\nGeneral HTML structure\n-----------------------", () => {
  describe("REQUIRED FOR ALL PAGES", () => {
    describe("Conventions", () => {
      test.each(docs)(
        "$name index.html has <title>, <meta> description and favicon info",
        ({ dom, name }) => {
          expect(
            dom.querySelector("title"),
            `${name} index.html is missing <title>`
          ).not.toBeNull();
          expect(
            dom.querySelector("meta[name=description]"),
            `${name} index.html is missing <meta> description tag`
          ).not.toBeNull();
          expect(
            dom.querySelector("link[rel='icon']"),
            `${name} index.html is missing link to favicon`
          ).not.toBeNull();
        }
      );

      test.each(docs)(
        "$name index.html contains exactly one <h1>",
        ({ dom, name }) => {
          const h1Count = dom.querySelectorAll("h1").length;
          expect(h1Count, `${name} index.html has ${h1Count} <h1>`).toBe(1);
        }
      );

      test("single tags end with '>' not '/>' (e.g. <meta ... > not <meta ... />)", () => {
        expect(
          fileText,
          "found a least one single tag ending with '/>'"
        ).not.toMatch(/\/>/);
      });
    });

    describe("Main menu", () => {
      test.each(docs)(
        "$name index.html has a <header> containing a <nav> and a <ul>",
        ({ dom, name }) => {
          expect(
            dom.querySelector("header"),
            `${name} index.html missing <header>`
          ).not.toBeNull();
          expect(
            dom.querySelector("header>nav"),
            `${name} index.html does not have a <nav> inside <header>`
          ).not.toBeNull();
          expect(
            dom.querySelector("header>nav>ul"),
            `${name} index.html does not have a <ul> in a <nav> in <header>`
          ).not.toBeNull();
        }
      );

      test.each(docs)(
        "$name index.html - relative paths used in main menu; paths do not end with 'index.html'",
        ({ dom, name }) => {
          const navLinks = dom.querySelectorAll("header>nav a");
          console.log(`navLinks: ${navLinks.length}\n`);
          console.log(navLinks);
          let errors = [];
          navLinks.forEach(link => {
            console.log(`count ${link.length} - current link: ${link.href}`);
            if (link.href) {
              if (link.href.match(/^http/)) {
                errors.push(`do not use absolute path: ${link}`);
              }
              if (link.href.match(/^\.\/|^\//)) {
                errors.push(
                  `do not begin relative paths with './' or '/': ${link}`
                );
              }
              if (link.href.match(/index.html/)) {
                errors.push(`do not include 'index.html' in path: ${link}`);
              } else if (!link.href.match(/\/$/)) {
                errors.push(
                  `end relative paths to folder containing index.html with '/': ${link}`
                );
              }
            }
          });
          expect(
            errors.length,
            `${name} index.html:\n\t\t ${errors.join("\n\t\t")}`
          ).toBe(0);
        }
      );
    });
  });
});

describe("MAIN index.html ONLY", () => {
  test("contains <figure> with one image and a <figcaption>", () => {
    const figure = docs[INDEX].dom.querySelector("figure");
    expect(figure, "no <figure> found").not.toBeNull();
    if (figure) {
      expect(
        figure.querySelector("img"),
        "<figure> does not contain an <img>"
      ).not.toBeNull();
      expect(
        figure.querySelector("figcaption"),
        "no <figcaption> in <figure>"
      ).not.toBeNull();
    }
  });

  test("contains a <main>", () =>
    expect(
      docs[INDEX].dom.querySelector("main"),
      "no <main> found"
    ).not.toBeNull());

  test("<main> contains at least two <article> elements", () => {
    const articles = docs[INDEX].dom.querySelectorAll("article");
    expect(
      articles.length,
      `<main> contains ${articles.length} <article> elements`
    ).toBeGreaterThanOrEqual(2);
  });

  // TODO append 'and an <a class="button">'
  test("<article> elements contain an <h2> and at least one <p>", () => {
    const articles = docs[INDEX].dom.querySelectorAll("article");
    expect(articles.length, "no <article> found").toBeGreaterThan(0);
    articles.forEach((article, i) => {
      expect(
        article.querySelector("h2"),
        `<article> number ${i + 1} missing an <h2>`
      ).not.toBeNull();
      expect(
        article.querySelectorAll("p"),
        `<article> number ${i + 1} missing a <p>`
      ).not.toBeNull();
      // expect(
      //   article.querySelector("a.button"),
      //   `<article> number ${i + 1} does not have an <a class="button">`
      // ).not.toBeNull();
    });
  });

  // aside and footer tests
  test("contains an <aside> with text inside a <p>", () => {
    expect(
      docs[INDEX].dom.querySelector("aside"),
      "no <aside> found"
    ).not.toBeNull();
    expect(
      docs[INDEX].dom.querySelector("aside  p"),
      "<aside> does not contain a <p>"
    ).not.toBeNull();
  });

  test("contains a <footer> with text inside a <p>", () => {
    expect(
      docs[INDEX].dom.querySelector("footer"),
      "no <footer> found"
    ).not.toBeNull();
    expect(
      docs[INDEX].dom.querySelector("footer p"),
      "<footer> does not contain a <p>"
    ).not.toBeNull();
  });

  // text-level semantics tests
  test("uses at least one instance of <strong>", () =>
    expect(
      docs[INDEX].dom.querySelector("strong"),
      "no <strong> found"
    ).not.toBeNull());

  test("uses at least one instance of <em>", () =>
    expect(
      docs[INDEX].dom.querySelector("em"),
      "no <em> found"
    ).not.toBeNull());
});

// TODO: check for no images
describe("\nImage tests\n-----------------------", () => {
  test("image paths are all lowercase and contain no spaces", () => {
    // no uppercase or whitespace
    const noUpper = new RegExp(/[A-Z]|\s/);

    images.forEach(img => {
      expect(
        noUpper.test(img.path),
        `image path "${img.path}" in ${img.file} index.html should be lowercase with no spaces`
      ).toBe(false);
    });
  });

  // TODO: check <picture> source images
  // TODO: up to 2000px in later assignments
  test("images must be 900px wide or less", () =>
    images.forEach(img =>
      expect(
        img.dimensions.width,
        `image width of ${img.dimensions.width} in ${img.file} index.html too wide`
      ).toBeLessThanOrEqual(900)
    ));

  test("relative paths to images used, and images must be in the images directory", () => {
    const regex = new RegExp(/^images\//);
    images.forEach(image => {
      expect(
        regex.test(image.path),
        `image path ${image.path} in ${image.file} index.html should relative path`
      ).toBe(true);
    });
  });

  // TODO: check <picture> source images
  // TODO: append 'non-SVG and non-<picture>' to message
  test("<img> height and width attributes set to the image's intrinsic dimensions", () => {
    let dimOK = true;
    let issues = [];
    images.forEach(image => {
      if (image.checkDimensions) {
        if (image.dimensions.width !== image.img.width) {
          dimOK = false;
          issues.push(
            `${image.file} index.html:"${image.path}" <img> width attribute of ${image.img.width} needs to be set to image intrinsic width of ${image.dimensions.width}`
          );
        }
        if (image.dimensions.height !== image.img.height) {
          dimOK = false;
          issues.push(
            `${image.file} index.html: "${image.path}" <img> height attribute of ${image.img.height} needs to be set to image intrinsic height of ${image.dimensions.height}`
          );
        }
      }
    });
    expect(dimOK, `- ${issues.join("\n- ")}`).toBe(true);
  });

  // test("<picture> element must contain three <source> elements with media and srcset attributes", () => {
  //   const sources = docs[INDEX].querySelectorAll("picture > source");
  //   expect(sources.length).toBeGreaterThanOrEqual(3);
  //   sources.forEach(source => {
  //     expect(source.getAttribute("media")).not.toBeNull();
  //     expect(source.getAttribute("srcset")).not.toBeNull();
  //   });
  // });

  // test("contact page loads an SVG file with <img>", () =>
  //   expect(docs[CONTACT].querySelector("img[src$='.svg']")).not.toBeNull());
});
