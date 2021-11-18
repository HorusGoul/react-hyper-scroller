import { DEFAULT_ITEMS_TO_GENERATE } from '../src/utils';
import { Page } from 'puppeteer';

jest.setTimeout(32000);

describe('Window as targetView', () => {
  test('HyperScroller loads correctly', async () => {
    await page.goto('http://localhost:3000/demos/basic.html');

    const html = await page.$eval('#root', (e) => e.innerHTML);
    expect(html).toContain(`Item 0`);
    expect(html).toContain(`Item 1`);
    expect(html).toContain(`Item 2`);
  });

  test('scrolls through the list', async () => {
    await page.goto('http://localhost:3000/demos/scroll-restoration.html');

    await page.$eval('#root', (e) => e.innerHTML);

    for (let i = 0; i < DEFAULT_ITEMS_TO_GENERATE; i++) {
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
    expect(html).toContain(`Item ${DEFAULT_ITEMS_TO_GENERATE - 1}`);
  });

  test('scroll restoration works', async () => {
    await page.goto('http://localhost:3000/demos/scroll-restoration.html');

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
    await page.goto('http://localhost:3000/demos/scroll-restoration.html');

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

  test('hiding scroller, changing cache key and then showing should display the correct items instead of only one', async () => {
    await page.goto('http://localhost:3000/demos/scroll-restoration.html');

    let html = await page.$eval('#root', (e) => e.innerHTML);
    expect(html).toContain(`Item 0`);

    await clearInput('#cache-key');
    await page.type('#cache-key', 'a');

    html = await page.$eval('#root', (e) => e.innerHTML);
    expect(html).toContain(`Item 1`);

    await toggleScroller();
    await delay(100);

    await clearInput('#cache-key');
    await page.type('#cache-key', 'b');
    await toggleScroller();
    await delay(100);

    html = await page.$eval('#root', (e) => e.innerHTML);
    expect(html).toContain(`Item 1`);
  });

  test.each(['0', '10', '20', '40', '60', '99'])(
    'scroll to item %s works',
    async (id) => {
      await page.goto('http://localhost:3000/demos/scroll-to-item.html');

      let html = await page.$eval('#root', (e) => e.innerHTML);
      expect(html).toContain(`Item 0`);

      await clearInput('#item-id');
      await page.type('#item-id', `id-${id}`);
      await click('#scroll-to-item-btn');
      await delay(100);

      html = await page.$eval('#root', (e) => e.innerHTML);
      expect(html).toContain(`Item ${id}`);

      const top = await page.$eval(`[data-testid="item-id-${id}"]`, (e) => {
        const top = e.getBoundingClientRect().top;
        return top;
      });

      expect(top).toBeGreaterThanOrEqual(0);
    },
  );
});

describe('HTMLElement as targetView', () => {
  test('HyperScroller loads correctly', async () => {
    await page.goto('http://localhost:3000/demos/different-target.html');

    const html = await page.$eval('#root', (e) => e.innerHTML);
    expect(html).toContain(`Item 0`);
    expect(html).toContain(`Item 1`);
    expect(html).toContain(`Item 2`);
  });

  test('scrolls through the list', async () => {
    await page.goto('http://localhost:3000/demos/different-target.html');

    await page.$eval('#root', (e) => e.innerHTML);
    await delay(100);

    for (let i = 0; i < DEFAULT_ITEMS_TO_GENERATE; i++) {
      const endReached = await page.evaluate(() => {
        const targetView = document.querySelector(
          '#target-view',
        ) as HTMLDivElement;

        if (
          targetView.scrollTop + targetView.clientHeight >=
          targetView.scrollHeight
        ) {
          return true;
        }

        return false;
      });

      if (endReached) {
        break;
      }

      await scrollByInnerHeight(page, '#target-view');
    }

    const html = await page.$eval('#root', (e) => e.innerHTML);
    expect(html).toContain(`Item ${DEFAULT_ITEMS_TO_GENERATE - 1}`);
  });

  test('scroll restoration works', async () => {
    await page.goto('http://localhost:3000/demos/different-target.html');

    await page.$eval('#root', (e) => e.innerHTML);

    await scrollByInnerHeight(page, '#target-view');
    await scrollByInnerHeight(page, '#target-view');
    await scrollByInnerHeight(page, '#target-view');

    const scrollBeforeUnmount = await getScrollY('#target-view');
    await toggleScroller();
    await delay(100);

    const scrollAfterUnmount = await getScrollY('#target-view');
    await toggleScroller();
    await delay(100);

    const scrollAfterMount = await getScrollY('#target-view');

    expect(scrollAfterMount).toBe(scrollBeforeUnmount);
    expect(scrollAfterUnmount).toBe(0);
  });

  test('cache key scroll restoration works', async () => {
    await page.goto('http://localhost:3000/demos/different-target.html');

    await page.$eval('#root', (e) => e.innerHTML);

    await clearInput('#cache-key');
    await page.type('#cache-key', 'first-cache-key');
    await scrollByInnerHeight(page, '#target-view');
    await scrollByInnerHeight(page, '#target-view');
    await scrollByInnerHeight(page, '#target-view');
    const scrollWithFirstCacheKey = await getScrollY('#target-view');

    await clearInput('#cache-key');
    await page.type('#cache-key', 'second-cache-key');
    await delay(100);

    const initialScrollWithSecondCacheKey = await getScrollY('#target-view');

    expect(initialScrollWithSecondCacheKey).toBe(0);
    expect(initialScrollWithSecondCacheKey).not.toBe(scrollWithFirstCacheKey);

    await scrollByInnerHeight(page, '#target-view');
    await scrollByInnerHeight(page, '#target-view');
    const scrollWithSecondCacheKey = await getScrollY('#target-view');

    await clearInput('#cache-key');
    await page.type('#cache-key', 'first-cache-key');
    await delay(100);
    const scrollAfterRestoringFirstCacheKey = await getScrollY('#target-view');

    expect(scrollAfterRestoringFirstCacheKey).toBe(scrollWithFirstCacheKey);
    expect(scrollAfterRestoringFirstCacheKey).not.toBe(
      scrollWithSecondCacheKey,
    );

    await clearInput('#cache-key');
    await page.type('#cache-key', 'third-cache-key');
    await delay(100);
    const initialScrollWithThirdCacheKey = await getScrollY('#target-view');

    expect(initialScrollWithThirdCacheKey).toBe(0);
    expect(initialScrollWithSecondCacheKey).not.toBe(scrollWithFirstCacheKey);
  });

  test('hiding scroller, changing cache key and then showing should display the correct items instead of only one', async () => {
    await page.goto('http://localhost:3000/demos/different-target.html');

    let html = await page.$eval('#root', (e) => e.innerHTML);
    expect(html).toContain(`Item 0`);

    await clearInput('#cache-key');
    await page.type('#cache-key', 'a');

    html = await page.$eval('#root', (e) => e.innerHTML);
    expect(html).toContain(`Item 1`);

    await toggleScroller();
    await delay(100);

    await clearInput('#cache-key');
    await page.type('#cache-key', 'b');
    await toggleScroller();
    await delay(100);

    html = await page.$eval('#root', (e) => e.innerHTML);
    expect(html).toContain(`Item 1`);
  });

  test.each(['0', '10', '20', '40', '60', '99'])(
    'scroll to item %s works',
    async (id) => {
      await page.goto('http://localhost:3000/demos/scroll-to-item-target.html');

      let html = await page.$eval('#root', (e) => e.innerHTML);
      expect(html).toContain(`Item 0`);

      await clearInput('#item-id');
      await page.type('#item-id', `id-${id}`);
      await click('#scroll-to-item-btn');
      await delay(100);

      html = await page.$eval('#root', (e) => e.innerHTML);
      expect(html).toContain(`Item ${id}`);

      const top = await page.$eval(`[data-testid="item-id-${id}"]`, (e) => {
        const top = e.getBoundingClientRect().top;
        return top;
      });

      expect(top).toBeGreaterThanOrEqual(0);
    },
  );
});

describe('measureItems: false', () => {
  test('HyperScroller loads correctly', async () => {
    await page.goto('http://localhost:3000/demos/basic-static-height.html');

    const html = await page.$eval('#root', (e) => e.innerHTML);
    expect(html).toContain(`Item 0`);
    expect(html).toContain(`Item 1`);
    expect(html).toContain(`Item 2`);
  });

  test('scrolls through the list', async () => {
    await page.goto('http://localhost:3000/demos/basic-static-height.html');

    await page.$eval('#root', (e) => e.innerHTML);

    for (let i = 0; i < DEFAULT_ITEMS_TO_GENERATE; i++) {
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
    expect(html).toContain(`Item ${DEFAULT_ITEMS_TO_GENERATE - 1}`);
  });
});

function getScrollY(selector?: string) {
  return selector
    ? page.$eval(selector, (element) => element.scrollTop)
    : page.evaluate(() => window.scrollY);
}

async function toggleScroller() {
  await click('#toggle-btn');
}

async function click(selector: string) {
  await page.$eval(selector, (element) => {
    const button = element as HTMLButtonElement;
    button.click();
  });
}

async function scrollByInnerHeight(page: Page, selector?: string) {
  if (selector) {
    await page.evaluate(`
    (async () => {
      const targetView = document.querySelector('${selector}');

      const timeout = new Promise((resolve, reject) => {
        setTimeout(() => {
          targetView.scrollBy(0, targetView.clientHeight);
          resolve();
        }, 100);
      });

      await timeout;
    })();
  `);

    return;
  }

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
