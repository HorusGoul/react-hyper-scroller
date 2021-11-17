export interface IHyperScrollerCache {
  scrollPosition: number;
  [index: number]: number;
}

export interface IHyperScrollerCacheList {
  [key: string]: IHyperScrollerCache;
}

export class HyperScrollerCacheService {
  private idSequence = 0;
  private cacheList: IHyperScrollerCacheList = {};

  public getCache(key: string) {
    const cache = this.cacheList[key];

    if (!cache) {
      return this.createCache(key);
    }

    return cache;
  }

  public removeCache(key: string) {
    delete this.cacheList[key];
  }

  public getNextId() {
    return 'cache-' + this.idSequence++;
  }

  private createCache(key: string) {
    this.cacheList[key] = {
      scrollPosition: 0,
    };

    return this.cacheList[key];
  }
}

export default new HyperScrollerCacheService();
