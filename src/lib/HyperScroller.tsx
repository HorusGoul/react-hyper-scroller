import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {
  combineRefs,
  defaultHyperScrollerState,
  isHTMLElement,
  isWindow,
  scrollTo,
  HyperScrollerTargetView,
} from './utils';
import HyperScrollerCacheService from './HyperScrollerCacheService';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const HyperScrollerContext = createContext<HyperScrollerController>(null);

interface HyperScroller {
  (props: HyperScrollerProps): React.ReactElement;
  Item: typeof HyperScrollerItem;
}

interface UseHyperScrollerParams {
  /**
   * Estimated height that will be used on initial
   * render for each item.
   */
  estimatedItemHeight: number;

  /**
   * Cache key on HyperScrollerCacheService.
   *
   * @defaultValue `HyperScrollerCacheService.getNextId()`
   */
  cacheKey?: string;

  /**
   * Number of items that will be rendered before and after the
   * ones that are shown in the viewport.
   *
   * @defaultValue 2
   */
  overscanItemCount?: number;

  /**
   * Target view that will be used as a scroll view.
   *
   * @defaultValue `window`
   */
  targetView?: HyperScrollerTargetView;

  /**
   * Initial scroll position.
   *
   * @defaultValue 0
   */
  initialScrollPosition?: number;

  /**
   * Allows telling the component whether you want it to
   * restore the scroll or not.
   *
   * Scroll restoration depends on the `cacheKey` as it
   * will retrieve the latest scroll position from the cache.
   *
   * @defaultValue false
   */
  scrollRestoration?: boolean;
}

interface HyperScrollerController {
  setItemCount(itemsCount: number): void;
  createItemRef(index: number): React.RefObject<HTMLElement>;
  updateProjection(): void;
  scheduleUpdateProjection(): void;
  resetState(): void;
  scrollToInitialPosition(): void;
  restoreScrollPosition(cacheKey: string): void;
  saveScrollPosition(cacheKey: string): void;

  // State
  state: {
    paddingTop: number;
    paddingBottom: number;
    firstIndex: number;
    lastIndex: number;
  };

  scrollerRef: React.RefObject<HTMLDivElement>;

  cacheKey: string;

  scrollRestoration: boolean;
}

export function useHyperScrollerController({
  estimatedItemHeight,
  cacheKey,
  targetView = window,
  overscanItemCount = 2,
  initialScrollPosition = 0,
  scrollRestoration = false,
}: UseHyperScrollerParams): HyperScrollerController {
  const [itemCount, setItemCount] = useState(0);

  // State
  const [state, setState] = useState<HyperScrollerController['state']>(() => ({
    ...defaultHyperScrollerState,
  }));

  const resetState = useCallback(() => {
    setState({
      ...defaultHyperScrollerState,
    });
  }, []);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const itemsRefs = useRef<Record<number, React.RefObject<HTMLElement>>>({});

  // Cache
  const [internalCacheKey, setInternalCacheKey] = useState(
    () => cacheKey ?? HyperScrollerCacheService.getNextId(),
  );
  const cache = HyperScrollerCacheService.getCache(internalCacheKey);

  useEffect(() => {
    let key = cacheKey;

    if (!key) {
      key = HyperScrollerCacheService.getNextId();
    }

    setInternalCacheKey(key);
  }, [cacheKey]);

  // Scroll restoration
  const scrollToInitialPosition = useCallback(() => {
    scrollTo(targetView, 0, initialScrollPosition);
  }, [targetView, initialScrollPosition]);

  const restoreScrollPosition = useCallback(
    (cacheKey: string) => {
      const cache = HyperScrollerCacheService.getCache(cacheKey);
      scrollTo(targetView, 0, cache.scrollPosition);
    },
    [targetView],
  );

  const getScrollPosition = useCallback(() => {
    const y = isWindow(targetView)
      ? targetView.scrollY
      : targetView.current?.scrollTop ?? 0;

    return y < initialScrollPosition ? initialScrollPosition : y;
  }, [targetView, initialScrollPosition]);

  const saveScrollPosition = useCallback(
    (cacheKey: string) => {
      const cache = HyperScrollerCacheService.getCache(cacheKey);
      cache.scrollPosition = getScrollPosition();
    },
    [getScrollPosition],
  );

  const createItemRef = useCallback((index: number) => {
    const ref = React.createRef<HTMLElement>();
    itemsRefs.current[index] = ref;
    return ref;
  }, []);

  const calculateRowHeight = useCallback(
    (index: number) => {
      const height = cache[index];

      return height || estimatedItemHeight;
    },
    [cache, estimatedItemHeight],
  );

  const updateProjection = useCallback(() => {
    if (!itemCount) {
      return;
    }

    const listDiv = scrollerRef.current;

    if (!listDiv) {
      return;
    }

    const view = isWindow(targetView) ? targetView : targetView.current;

    if (!view) {
      return;
    }

    const viewport = isHTMLElement(view)
      ? {
          height: view.clientHeight,
          scrollY: view.scrollTop - listDiv.offsetTop,
        }
      : {
          height: view.innerHeight,
          scrollY: view.scrollY - listDiv.offsetTop,
        };

    if (viewport.scrollY < 0) {
      viewport.scrollY = 0;
    }

    const visibleItemsMaxTop = viewport.scrollY + viewport.height;
    let visibleItemsHeight = 0;
    let itemsHeightSum = 0;
    let firstIndex: number | undefined;
    let lastIndex: number | undefined;
    let paddingTop = 0;
    let paddingBottom = 0;

    // TODO: Use binary search to find the first index
    for (let i = 0; i < itemCount; i++) {
      const prevSum = itemsHeightSum;
      itemsHeightSum += calculateRowHeight(i);

      if (itemsHeightSum >= viewport.scrollY && firstIndex === undefined) {
        paddingTop = prevSum;
        firstIndex = i - overscanItemCount;

        if (firstIndex < 0) {
          firstIndex = 0;
        }

        for (let j = firstIndex; j < i; j++) {
          paddingTop -= calculateRowHeight(j);
        }
      }

      if (
        (itemsHeightSum >= visibleItemsMaxTop && !lastIndex) ||
        (i === itemCount - 1 && !lastIndex)
      ) {
        lastIndex = i + overscanItemCount;
        visibleItemsHeight = itemsHeightSum;

        if (lastIndex >= itemCount) {
          lastIndex = itemCount - 1;
        }

        for (let j = lastIndex; j > i; j--) {
          visibleItemsHeight += calculateRowHeight(j);
        }
      }
    }

    paddingBottom = itemsHeightSum - visibleItemsHeight;

    if (paddingBottom < 0) {
      paddingBottom = 0;
    }

    setState((currentState) => ({
      ...currentState,
      firstIndex: firstIndex ?? 0,
      lastIndex: lastIndex ?? 0,
      paddingBottom,
      paddingTop,
    }));
  }, [calculateRowHeight, overscanItemCount, itemCount, targetView]);

  const rAFRef = useRef<number>();

  const scheduleUpdateProjection = useCallback(() => {
    if (rAFRef.current) {
      window.cancelAnimationFrame(rAFRef.current);
    }

    rAFRef.current = window.requestAnimationFrame(updateProjection);
  }, [updateProjection]);

  // Update projection on resize or scroll events
  useEffect(() => {
    const view = isWindow(targetView) ? window : targetView?.current;

    if (!view) {
      return;
    }

    function onEventListener() {
      scheduleUpdateProjection();
    }

    window.addEventListener('resize', onEventListener);
    view.addEventListener('scroll', onEventListener);

    return () => {
      window.removeEventListener('resize', onEventListener);
      view.removeEventListener('scroll', onEventListener);

      if (rAFRef.current) {
        window.cancelAnimationFrame(rAFRef.current);
      }
    };
  }, [targetView, scheduleUpdateProjection]);

  return {
    // State
    state,

    // Functions
    setItemCount,
    updateProjection,
    scheduleUpdateProjection,
    resetState,

    // Scroll
    scrollRestoration,
    scrollToInitialPosition,
    restoreScrollPosition,
    saveScrollPosition,

    // Refs
    scrollerRef,
    createItemRef,

    // Cache
    cacheKey: internalCacheKey,
  };
}

interface HyperScrollerProps {
  children: React.ReactNode;
  controller: HyperScrollerController;
}

function HyperScroller({ children, controller }: HyperScrollerProps) {
  const {
    setItemCount,
    createItemRef,
    updateProjection,
    resetState,
    cacheKey,
    scrollerRef,
    saveScrollPosition,
    restoreScrollPosition,
    scrollToInitialPosition,
    scrollRestoration,
  } = controller;
  const items = React.Children.toArray(children);
  const itemCount = items.length;

  useEffect(() => {
    setItemCount(itemCount);
  }, [setItemCount, itemCount]);

  useEffect(() => {
    resetState();
    updateProjection();
  }, [cacheKey, updateProjection, resetState]);

  useLayoutEffect(() => {
    if (scrollRestoration) {
      restoreScrollPosition(cacheKey);
    } else {
      scrollToInitialPosition();
    }

    return () => {
      saveScrollPosition(cacheKey);
    };
  }, [
    cacheKey,
    scrollRestoration,
    scrollToInitialPosition,
    saveScrollPosition,
    restoreScrollPosition,
  ]);

  const { firstIndex, lastIndex, paddingBottom, paddingTop } = controller.state;
  const projection = [];

  if (itemCount) {
    for (let i = firstIndex; i <= lastIndex; i++) {
      const item = items[i];
      const ref = createItemRef(i);
      let projectionItem: JSX.Element;

      if (isHyperScrollerItemChild(item)) {
        projectionItem = React.cloneElement(item, {
          ...item.props,
          index: i,
          ref: combineRefs(item.props.ref, ref),
          key: i,
        });
      } else {
        projectionItem = (
          <HyperScrollerItem key={i} as="div" index={i} ref={createItemRef(i)}>
            {item}
          </HyperScrollerItem>
        );
      }

      projection[projection.length] = projectionItem;
    }
  }

  return (
    <HyperScrollerContext.Provider value={controller}>
      <div ref={scrollerRef} style={{ paddingTop, paddingBottom }}>
        {projection}
      </div>
    </HyperScrollerContext.Provider>
  );
}

interface HyperScrollerItemProps {
  children: React.ReactNode;
  as?: React.ElementType;
  index?: number;
}

const HyperScrollerItem = forwardRef<HTMLElement, HyperScrollerItemProps>(
  function HyperScrollerItem(
    { children, as: Component = 'div', index = -1 },
    forwardedRef,
  ) {
    const { cacheKey, scheduleUpdateProjection } =
      useContext(HyperScrollerContext);
    const innerRef = useRef<HTMLElement>(null);

    useEffect(() => {
      const element = innerRef.current;

      if (!element) {
        return;
      }

      let unmounted = false;
      const cache = HyperScrollerCacheService.getCache(cacheKey);

      const resizeObserver = new ResizeObserver((entries) => {
        if (unmounted) {
          return;
        }

        const entry = entries[0];

        if (entry.target !== element || entry.target.parentNode === null) {
          return;
        }

        const { height } = entry.contentRect;
        cache[index] = height;

        scheduleUpdateProjection();
      });

      resizeObserver.observe(element);

      return () => {
        unmounted = true;
        resizeObserver.disconnect();
      };
    }, [innerRef, cacheKey, index, scheduleUpdateProjection]);

    return (
      <Component ref={combineRefs(innerRef, forwardedRef)}>
        {children}
      </Component>
    );
  },
);

HyperScrollerItem.displayName = 'HyperScrollerItem';

HyperScroller.Item = HyperScrollerItem;

export default HyperScroller as HyperScroller;

function isHyperScrollerItemChild(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  item: any,
): item is React.ReactElement<
  React.ComponentPropsWithRef<typeof HyperScrollerItem>
> {
  return item?.type?.displayName === HyperScrollerItem.displayName;
}
