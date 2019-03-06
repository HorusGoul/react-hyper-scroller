import { launch, LaunchOptions, Browser } from "puppeteer";
import { ITEMS_TO_GENERATE } from "./test-app/src/utils";

jest.setTimeout(32000);

const CONFIG: LaunchOptions =
  process.env.NODE_ENV === "debug"
    ? {
        headless: false,
        slowMo: 250,
        devtools: true,
      }
    : {};

describe("e2e tests", async () => {
  let browser: Browser;

  beforeAll(async () => {
    browser = await launch(CONFIG);
  });

  afterAll(async () => {
    await browser.close();
  });

  test("VirtualScroller loads correctly", async () => {
    const page = await browser.newPage();

    page.emulate({
      viewport: {
        width: 500,
        height: 720,
      },
      userAgent: "",
    });

    await page.goto("http://localhost:3001");

    const html = await page.$eval("#root", e => e.innerHTML);
    expect(html).toContain(`Item 0`);
  });

  test("scrolls through the list", async () => {
    const page = await browser.newPage();

    page.emulate({
      viewport: {
        width: 500,
        height: 720,
      },
      userAgent: "",
    });

    await page.goto("http://localhost:3001");

    await page.$eval("#root", e => e.innerHTML);

    for (let i = 0; i < ITEMS_TO_GENERATE; i++) {
      const endReached = await page.evaluate(() => {
        if (window.scrollY + window.innerHeight >= document.body.offsetHeight) {
          return true;
        }

        return false;
      });

      if (endReached) {
        break;
      }

      await page.evaluate(`
        (async () => {
          if (window.scrollY + window.innerHeight >= document.body.offsetHeight) {
            return;
          }

          const timeout = new Promise((resolve, reject) => {
            setTimeout(() => {
              window.scrollBy(0, window.innerHeight);
              resolve();
            }, 50);
          });

          await timeout;
        })();
      `);
    }

    const html = await page.$eval("#root", e => e.innerHTML);
    expect(html).toContain(`Item ${ITEMS_TO_GENERATE - 1}`);
  });
});
