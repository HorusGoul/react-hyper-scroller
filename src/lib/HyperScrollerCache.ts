interface HyperScrollerCacheItem {
  key: string;
  height: number;
  index: number;
}

export class HyperScrollerCache {
  private static cacheKeyId = 0;
  private static cacheList: Record<string, HyperScrollerCache> = {};

  public static getOrCreateCache(cacheKey?: string) {
    const key = cacheKey ?? `@@${HyperScrollerCache.cacheKeyId++}`;

    let cache = HyperScrollerCache.cacheList[key];

    if (!cache) {
      cache = new HyperScrollerCache(key);
      HyperScrollerCache.cacheList[key] = cache;
    }

    return cache;
  }

  public readonly key: string;
  public scrollPosition = 0;
  public estimatedItemHeight = 0;
  private itemsByKey: Record<string, HyperScrollerCacheItem> = {};
  private itemsByIndex: HyperScrollerCacheItem[] = [];

  constructor(cacheKey: string) {
    this.key = cacheKey;
  }

  public setItem(key: string, index: number, height: number) {
    const cacheItem = {
      key,
      height,
      index,
    };

    this.itemsByKey[key] = cacheItem;
    this.itemsByIndex[index] = cacheItem;
  }

  public getItemByKey(key: string): HyperScrollerCacheItem | undefined {
    return this.itemsByKey[key];
  }

  public getItemByIndex(index: number): HyperScrollerCacheItem | undefined {
    return this.itemsByIndex[index];
  }

  public getItemScrollPosition(key: string): number | undefined {
    const item = this.getItemByKey(key);

    if (!item) {
      return;
    }

    let scrollPosition = 0;

    for (let i = 0; i < item.index; i++) {
      const item = this.itemsByIndex[i];

      if (item) {
        scrollPosition += item.height;
      } else {
        scrollPosition += this.estimatedItemHeight;
      }
    }

    return scrollPosition;
  }
}