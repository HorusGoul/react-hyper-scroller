import { launch, LaunchOptions } from "puppeteer";

const CONFIG: LaunchOptions =
  process.env.NODE_ENV === "debug"
    ? {
        headless: false,
        slowMo: 250,
        devtools: true,
      }
    : {};

describe("on page load", async () => {
  let browser;

  beforeAll(async () => {
    browser = await launch(CONFIG);
  });

  afterAll(async () => {
    await browser.close();
  });

  test(
    "h1 loads correctly",
    async () => {
      const page = (await browser.pages())[0];

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
    },
    16000,
  );
});
