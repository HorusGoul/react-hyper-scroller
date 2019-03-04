import { launch, LaunchOptions } from "puppeteer";

const CONFIG: LaunchOptions =
  process.env.NODE_ENV === "debug"
    ? {
        headless: false,
        slowMo: 250,
        devtools: true,
      }
    : {};

describe("on page load", () => {
  test(
    "h1 loads correctly",
    async () => {
      const browser = await launch(CONFIG);
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
      browser.close();
    },
    16000,
  );
});
