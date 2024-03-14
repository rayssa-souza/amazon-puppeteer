const puppeteer = require("puppeteer-extra");

const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const AdblockerPlugin = require("puppeteer-extra-plugin-adblocker");

puppeteer.use(StealthPlugin());

puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

const scrapeAmazonPage = async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto("https://www.amazon.com/gp/goldbox?ref_=nav_cs_gb");
};
scrapeAmazonPage();
