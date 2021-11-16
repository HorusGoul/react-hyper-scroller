import { ITEMS_TO_GENERATE } from '../src/utils';
import { Page } from 'puppeteer';

jest.setTimeout(32000);

describe('e2e tests', () => {
  test('VirtualScroller loads correctly', async () => {
    await page.goto('http://localhost:3000');

    const html = await page.$eval('#root', (e) => e.innerHTML);
    expect(html).toContain(`Item 0`);
  });

  test('scrolls through the list', async () => {
    await page.goto('http://localhost:3000');

    await page.$eval('#root', (e) => e.innerHTML);

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

    const html = await page.$eval('#root', (e) => e.innerHTML);
    expect(html).toContain(`Item ${ITEMS_TO_GENERATE - 1}`);
  });

  test('scroll restoration works', async () => {
    await page.goto('http://localhost:3000');

    await page.$eval('#root', (e) => e.innerHTML);

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

    expect(scrollAfterMount).toBe(scrollBeforeUnmount);
    expect(scrollAfterUnmount).toBe(0);
  });

  test('cache key scroll restoration works', async () => {
    await page.goto('http://localhost:3000');

    await page.$eval('#root', (e) => e.innerHTML);

    await clearInput('#cache-key');
    await page.type('#cache-key', 'first-cache-key');
    await scrollByInnerHeight(page);
    await scrollByInnerHeight(page);
    await scrollByInnerHeight(page);
    const scrollWithFirstCacheKey = await getScrollY();

    await clearInput('#cache-key');
    await page.type('#cache-key', 'second-cache-key');
    await delay(100);

    const initialScrollWithSecondCacheKey = await getScrollY();

    expect(initialScrollWithSecondCacheKey).toBe(0);
    expect(initialScrollWithSecondCacheKey).not.toBe(scrollWithFirstCacheKey);

    await scrollByInnerHeight(page);
    await scrollByInnerHeight(page);
    const scrollWithSecondCacheKey = await getScrollY();

    await clearInput('#cache-key');
    await page.type('#cache-key', 'first-cache-key');
    await delay(100);
    const scrollAfterRestoringFirstCacheKey = await getScrollY();

    expect(scrollAfterRestoringFirstCacheKey).toBe(scrollWithFirstCacheKey);
    expect(scrollAfterRestoringFirstCacheKey).not.toBe(
      scrollWithSecondCacheKey,
    );

    await clearInput('#cache-key');
    await page.type('#cache-key', 'third-cache-key');
    await delay(100);
    const initialScrollWithThirdCacheKey = await getScrollY();

    expect(initialScrollWithThirdCacheKey).toBe(0);
    expect(initialScrollWithSecondCacheKey).not.toBe(scrollWithFirstCacheKey);
  });
});

function getScrollY() {
  return page.evaluate(() => window.scrollY);
}

async function toggleScroller() {
  await page.$eval('#toggle-btn', (element) => {
    const button = element as HTMLButtonElement;
    button.click();
  });
}

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

async function clearInput(selector: string) {
  await page.$eval(selector, (element) => {
    const input = element as HTMLInputElement;
    input.value = '';
  });
}

function delay(timeout: number) {
  return new Promise((resolve) => setTimeout(resolve, timeout));
}
