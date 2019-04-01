import { ITEMS_TO_GENERATE } from "./test-app/src/utils";
import { Page } from "puppeteer";

jest.setTimeout(32000);

describe("e2e tests", async () => {
  beforeAll(async () => {
    await page.emulate({
      viewport: {
        width: 500,
        height: 720,
      },
      userAgent: "",
    });
  });

  test("VirtualScroller loads correctly", async () => {
    await page.goto("http://localhost:3001");

    const html = await page.$eval("#root", e => e.innerHTML);
    expect(html).toContain(`Item 0`);
  });

  test("scrolls through the list", async () => {
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

      await scrollByInnerHeight(page);
    }

    const html = await page.$eval("#root", e => e.innerHTML);
    expect(html).toContain(`Item ${ITEMS_TO_GENERATE - 1}`);
  });

  test("scroll restoration works", async () => {
    await page.goto("http://localhost:3001");

    await page.$eval("#root", e => e.innerHTML);

    await scrollByInnerHeight(page);
    await scrollByInnerHeight(page);
    await scrollByInnerHeight(page);

    const scrollBeforeUnmount = await getScrollY();
    await toggleScroller();
    await delay(100);

    const scrollAfterUnmount = await getScrollY();
    await toggleScroller();
    await delay(100);

    const scrollAfterMount = await getScrollY();

    expect(scrollBeforeUnmount).toBe(scrollAfterMount);
    expect(scrollAfterUnmount).toBe(0);

    function getScrollY() {
      return page.evaluate(() => window.scrollY);
    }

    async function toggleScroller() {
      await page.$eval("#toggle-btn", (button: HTMLButtonElement) => button.click());
    }
  });
});

async function scrollByInnerHeight(page: Page) {
  await page.evaluate(`
    (async () => {
      const timeout = new Promise((resolve, reject) => {
        setTimeout(() => {
          window.scrollBy(0, window.innerHeight);
          resolve();
        }, 100);
      });

      await timeout;
    })();
  `);
}

function delay(timeout: number) {
  return new Promise(resolve => setTimeout(resolve, timeout));
}
