interface HyperScrollerCacheItem {
  key: string;
  height: number;
  index: number;
  position: number;
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
  private updatePositionsRAF: number | undefined;

  constructor(cacheKey: string) {
    this.key = cacheKey;
  }

  public setItem(key: string, index: number, height: number) {
    const prevItemIndex = index - 1;
    let position = 0;

    if (prevItemIndex >= 0) {
      const prevItem = this.getItemByIndex(prevItemIndex);

      position = prevItem ? prevItem.position + prevItem.height : 0;
    }

    const cacheItem: HyperScrollerCacheItem = {
      key,
      height,
      index,
      position,
    };

    this.itemsByKey[key] = cacheItem;
    this.itemsByIndex[index] = cacheItem;

    if (this.updatePositionsRAF !== undefined) {
      window.cancelAnimationFrame(this.updatePositionsRAF);
    }

    this.updatePositionsRAF = window.requestAnimationFrame(() => {
      this.updateItemPositions();
    });
  }

  public getItemByKey(key: string): HyperScrollerCacheItem | undefined {
    return this.itemsByKey[key];
  }

  public getItemByIndex(index: number): HyperScrollerCacheItem | undefined {
    return this.itemsByIndex[index];
  }

  public getItemByScrollPosition(
    scrollPosition: number,
  ): HyperScrollerCacheItem | undefined {
    // Uses binary search to find the item that intersects with the scroll position
    let low = 0;
    let high = this.itemsByIndex.length - 1;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const item = this.itemsByIndex[mid];

      if (item) {
        if (
          item.position <= scrollPosition &&
          item.position + item.height > scrollPosition
        ) {
          return item;
        }

        if (item.position > scrollPosition) {
          high = mid - 1;
        } else {
          low = mid + 1;
        }
      } else {
        high = mid - 1;
      }
    }

    return this.getItemByIndex(this.itemsByIndex.length - 1);
  }

  private updateItemPositions() {
    let position = 0;

    for (let i = 0; i < this.itemsByIndex.length; i++) {
      const item = this.itemsByIndex[i];

      if (item) {
        item.position = position;
        position += item.height;
      }
    }
  }
}
