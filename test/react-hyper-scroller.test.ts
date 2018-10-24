import { VirtualScroller } from "../src/react-hyper-scroller";
import { VirtualScrollerCacheService } from "../src/VirtualScrollerCacheService";

describe("VirtualScroller", () => {
  it("is truthy", () => {
    expect(VirtualScroller).toBeTruthy();
  });
});

describe("VirtualScrollerCacheService", () => {
  it("creates cache", () => {
    const service = new VirtualScrollerCacheService();

    expect(service.getCache("cache")).toBeTruthy();
  });

  it("returns cache", () => {
    const service = new VirtualScrollerCacheService();

    // creates cache
    service.getCache("cache");

    expect(service.getCache("cache")).toBeTruthy();
  });

  it("removes cache", () => {
    const service = new VirtualScrollerCacheService();

    service.getCache("cache");
    service.removeCache("cache");
  });

  it("returns next id", () => {
    const service = new VirtualScrollerCacheService();

    expect(service.getNextId()).toBe("cache-0");
    expect(service.getNextId()).toBe("cache-1");
    expect(service.getNextId()).toBe("cache-2");
  });
});
