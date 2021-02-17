import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  memo,
  useLayoutEffect,
  useMemo,
} from "react";
import VirtualScrollerCacheService from "./VirtualScrollerCacheService";

export type VirtualScrollerTargetView = React.RefObject<HTMLElement> | Window;
export interface UseVirtualScrollerProps {
  /**
   * Max number of items.
   */
  itemCount: number;

  /**
   * Estimated height that will be used on initial
   * render for each item.
   */
  estimatedItemHeight: number;

  /**
   * Cache key on VirtualScrollerCacheService.
   *
   * @defaultValue `VirtualScrollerCacheService.getNextId()`
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
   * Initial scroll position.
   *
   * @defaultValue 0
   */
  initialScrollPosition?: number;

  /**
   * Target view that will be used as a scroll view.
   *
   * @defaultValue `window`
   */
  targetView?: VirtualScrollerTargetView;

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

interface IVirtualScrollerState {
  paddingTop: number;
  paddingBottom: number;
  firstIndex: number;
  lastIndex: number;
}

const defaultVirtualScrollerState = {
  firstIndex: 0,
  lastIndex: 0,
  paddingBottom: 0,
  paddingTop: 0,
};

function isWindow(targetView: VirtualScrollerTargetView): targetView is Window {
  return window === targetView;
}

function isHTMLElement(view: HTMLElement | Window): view is HTMLElement {
  return window !== view;
}

function scrollTo(targetView: VirtualScrollerTargetView, x: number, y: number) {
  window.requestAnimationFrame(() => {
    const view = isWindow(targetView) ? targetView : targetView.current;

    if (view === window) {
      view.scrollTo(x, y);
      return;
    }

    if (isHTMLElement(view)) {
      view.scrollTop = y;
      view.scrollLeft = x;
      return;
    }
  });
}

export function useVirtualScroller(
  {
    targetView = window,
    initialScrollPosition = 0,
    cacheKey,
    itemCount = 0,
    overscanItemCount = 2,
    estimatedItemHeight = 0,
    scrollRestoration = false
  }: UseVirtualScrollerProps
) {

  const [internalCacheKey, setInternalCacheKey] = useState(() => cacheKey ?? VirtualScrollerCacheService.getNextId())
  const [state, setState] = useState<IVirtualScrollerState>(() => ({
    ...defaultVirtualScrollerState,
  }));
  const cache = VirtualScrollerCacheService.getCache(internalCacheKey);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const itemsRefs = useRef<Record<number, React.RefObject<HTMLElement>>>({});

  useEffect(() => {
    let key = cacheKey;

    if (!key) {
      key = VirtualScrollerCacheService.getNextId()
    }

    setInternalCacheKey(key);
  }, [cacheKey])

  const scrollToInitialPosition = useCallback(
    () => {
      scrollTo(targetView, 0, initialScrollPosition);
    },
    [targetView, initialScrollPosition],
  );

  const restoreScroll = useCallback(
    () => {
      scrollTo(targetView, 0, cache.scrollPosition);
    },
    [targetView, cache.scrollPosition],
  );

  const getScrollPosition = useCallback(
    () => {
      const y = isWindow(targetView)
        ? targetView.scrollY
        : targetView.current?.scrollTop;

      return y < initialScrollPosition ? initialScrollPosition : y;
    },
    [targetView, initialScrollPosition],
  );

  const saveScrollPosition = useCallback(
    () => {
      cache.scrollPosition = getScrollPosition();
    },
    [cache, getScrollPosition],
  );

  const calculateRowHeight = useCallback(
    (index: number) => {
      const height = cache[index];
      const hasRef = !!itemsRefs.current[index];

      if (hasRef) {
        window.requestAnimationFrame(() => {
          const ref = itemsRefs.current[index];

          if (ref?.current) {
            cache[index] = ref.current.getBoundingClientRect().height;
          }
        });
      }

      return height || estimatedItemHeight;
    },
    [cache, estimatedItemHeight],
  );

  const updateProjection = useCallback(
    () => {
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
      let firstIndex: number;
      let lastIndex: number;
      let paddingTop = 0;
      let paddingBottom = 0;

      for (let i = 0; i < itemCount; i++) {
        const prevSum = itemsHeightSum;
        itemsHeightSum += calculateRowHeight(i);

        if (itemsHeightSum >= viewport.scrollY && isNaN(firstIndex)) {
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

      setState(currentState => ({
        ...currentState,
        firstIndex,
        lastIndex,
        paddingBottom,
        paddingTop,
      }));
    },
    [calculateRowHeight, overscanItemCount, itemCount, targetView],
  );

  // Update projection on resize or scroll events
  useEffect(
    () => {
      const view = isWindow(targetView) ? window : targetView?.current;

      if (!view) {
        return;
      }

      function onResizeListener() {
        updateProjection();
      }

      function onScrollListener() {
        updateProjection();
      }

      window.addEventListener("resize", onResizeListener);
      view.addEventListener("scroll", onScrollListener);

      return () => {
        window.removeEventListener("resize", onResizeListener);
        view.removeEventListener("scroll", onScrollListener);
      };
    },
    [targetView, updateProjection],
  );

  useLayoutEffect(
    () => {
      if (!targetView) {
        return;
      }

      setState({ ...defaultVirtualScrollerState });

      if (scrollRestoration) {
        restoreScroll();
      } else {
        scrollToInitialPosition();
      }

      updateProjection();

      return () => {
        saveScrollPosition();
      };
    },
    [internalCacheKey, targetView],
  );

  useLayoutEffect(
    () => {
      if (!targetView) {
        return;
      }

      updateProjection();
    },
    [updateProjection, targetView],
  );

  const createItemRef = useCallback((index: number) => {
    const ref = React.createRef<HTMLElement>()
    itemsRefs.current[index] = ref
    return ref
  }, []);

  const onItemUpdate = useCallback((index: number) => {
    updateProjection();
  }, [updateProjection]);

  return {
    // State
    state,
    cache,
    scrollerRef,
    itemsRefs,

    // Functions
    scrollToInitialPosition,
    getScrollPosition,
    saveScrollPosition,
    calculateRowHeight,
    updateProjection,
    createItemRef,
    onItemUpdate,

    // Props
    itemCount,
  }
}

export type UseVirtualScrollerResult = ReturnType<typeof useVirtualScroller>;

export interface VirtualScrollerProps extends UseVirtualScrollerResult {

  /**
   * Function that will be called when rendering an item.
   *
   * @param index Item's index.
   * @param ref Ref that should be attached to each item's root.
   * @param onItemUpdate Method that will trigger an update projection. This should be called
   *                     when the item changes its size. (e.g. The item has a button which
   *                     expands item's height showing new content).
   */
  itemRenderer(
    index: number,
    ref: React.RefObject<HTMLElement>,
    onItemUpdate: () => void,
  ): React.ReactNode;
}

function VirtualScrollerHooks({
  state,
  itemCount,
  itemRenderer,
  scrollerRef,
  createItemRef,
  onItemUpdate
}: VirtualScrollerProps) {
  return useMemo(
    () => {
      const projection = [];

      if (itemCount) {
        for (let i = state.firstIndex; i <= state.lastIndex; i++) {
          projection[projection.length] = itemRenderer(i, createItemRef(i), () =>
            onItemUpdate(i),
          );
        }
      }

      return (
        <div
          ref={scrollerRef}
          style={{
            paddingBottom: state.paddingBottom,
            paddingTop: state.paddingTop,
          }}
        >
          {projection}
        </div>
      );
    },
    [state],
  );
}

export const VirtualScroller = memo(VirtualScrollerHooks);
