const puppeteer = require("puppeteer-extra");
// Utilizando o puppeteer extra e o plugin Stealth para contornar o monitoramento de bots da Amazon.

const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());

// Criei essa função pois encontrei inconsistências entre execuções, ao interagir com elementos, ocasionando timeouts.
// Assim, ao adicionar o delay, a execução se tornou consistente.

function delay(ms = 1000) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const ENTRYPOINT = "https://www.amazon.com/gp/goldbox?ref_=nav_cs_gb";

const SEARCH_VALUE = "garlic press";
const ZIP_CODE = "11001";

const SELECTORS = {
  LOCATION_MODAL: {
    OPEN_MODAL_BUTTON: "#nav-global-location-popover-link",
    INPUT_TEXT: "#GLUXZipUpdateInput",
    INPUT_SUBMIT_BUTTON: '[aria-labelledby="GLUXZipUpdate-announce"]',
    MODAL_CONFIRM_INPUT_SUBMIT: ".a-popover-footer #GLUXConfirmClose",
    CLOSE_MODAL_BUTTON: ".a-popover-footer #GLUXConfirmClose",
  },
  SEARCH_BAR: {
    INPUT_TEXT: "#twotabsearchtextbox",
    INPUT_SUBMIT_BUTTON: "#nav-search-submit-button",
  },
  SEARCH_RESULTS_PAGE: {
    NON_SPONSORED_CLASS_PRODUCT_LINK:
      '[data-component-type="s-search-result"]:not(.AdHolder) .a-link-normal.s-underline-text.s-underline-link-text.s-link-style.a-text-normal',
  },
  PRODUCTS_DETAIL_PAGE: {
    TITLE: "#title",
    PRICE: ".a-offscreen",
    SOLD_QTY: "#social-proofing-faceout-title-tk_bought",
    REVIEW_RATING: ".reviewCountTextLinkedHistogram .a-icon-alt",
    REVIEW_COUNTING: "#acrCustomerReviewText",
    ABOUT_ITEM:
      "#featurebullets_feature_div .a-unordered-list.a-vertical.a-spacing-mini > li",
  },
};

const scrapeAmazonPage = async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--start-maximized"],
  });
  const page = await browser.newPage();
  await page.setViewport({
    width: 1920,
    height: 1080,
  });

  await page.goto(ENTRYPOINT, {
    waitUntil: "load",
  });

  await page.click(SELECTORS.LOCATION_MODAL.OPEN_MODAL_BUTTON);
  await page.waitForSelector(SELECTORS.LOCATION_MODAL.INPUT_TEXT);
  await delay();
  //
  await page.type(SELECTORS.LOCATION_MODAL.INPUT_TEXT, ZIP_CODE);
  await page.click(SELECTORS.LOCATION_MODAL.INPUT_SUBMIT_BUTTON);
  await page.waitForSelector(
    SELECTORS.LOCATION_MODAL.MODAL_CONFIRM_INPUT_SUBMIT,
    {
      visible: true,
    }
  );
  await page.click(SELECTORS.LOCATION_MODAL.CLOSE_MODAL_BUTTON);
  await delay();
  await page.waitForSelector(SELECTORS.SEARCH_BAR.INPUT_TEXT, {
    visible: true,
  });
  await page.type(SELECTORS.SEARCH_BAR.INPUT_TEXT, SEARCH_VALUE);

  await Promise.all([
    page.waitForNavigation(),
    await page.click(SELECTORS.SEARCH_BAR.INPUT_SUBMIT_BUTTON),
  ]);

  await Promise.all([
    page.waitForNavigation(),
    await page.click(
      SELECTORS.SEARCH_RESULTS_PAGE.NON_SPONSORED_CLASS_PRODUCT_LINK
    ),
  ]);

  const [title, price, soldQty, reviewRating, reviewCount, aboutItem] =
    await Promise.allSettled([
      page.$eval(SELECTORS.PRODUCTS_DETAIL_PAGE.TITLE, (el) =>
        el.textContent.trim()
      ),
      page.$eval(SELECTORS.PRODUCTS_DETAIL_PAGE.PRICE, (el) => {
        return el.textContent.trim();
      }),
      page.$eval(SELECTORS.PRODUCTS_DETAIL_PAGE.SOLD_QTY, (el) =>
        el.textContent.trim()
      ),
      page.$eval(SELECTORS.PRODUCTS_DETAIL_PAGE.REVIEW_RATING, (el) => {
        return el.textContent.trim();
      }),
      page.$eval(SELECTORS.PRODUCTS_DETAIL_PAGE.REVIEW_COUNTING, (el) => {
        return el.textContent.trim();
      }),
      page.$$eval(SELECTORS.PRODUCTS_DETAIL_PAGE.ABOUT_ITEM, (lis) => {
        return Array.from(lis).map((li) => li.textContent.trim());
      }),
    ]);

  await browser.close();

  const getResult = (item) => {
    if (item.status === "fulfilled") {
      if (Array.isArray(item.value) && item.value.length === 0) {
        return (item.value = "Info not found on Amazon");
      }
      return item.value;
    }
    return "Info not found on Amazon";
  };

  const productInfo = {
    title: getResult(title),
    price: getResult(price),
    soldQty: getResult(soldQty),
    reviewRating: getResult(reviewRating),
    reviewCounting: getResult(reviewCount),
    aboutItem: getResult(aboutItem),
  };
  console.log(productInfo);
};
scrapeAmazonPage();
