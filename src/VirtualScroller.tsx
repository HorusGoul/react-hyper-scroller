import React, { useEffect, useState, useCallback, useRef, memo } from "react";
import { findDOMNode } from "react-dom";
import VirtualScrollerCacheService from "./VirtualScrollerCacheService";

export type VirtualScrollerTargetView = Element | Window;

interface IVirtualScrollerRowRef {
  ref: React.ReactInstance;
  DOMNode: Element | Text;
}

export interface IVirtualScrollerProps {
  /**
   * Max number of rows / items.
   */
  rowCount: number;

  /**
   * Estimated height that will be used on initial
   * render for each item.
   */
  defaultRowHeight: number;

  /**
   * Function that will be called when rendering an item.
   *
   * @param index Item's index.
   * @param rowRef Ref that should be attached to each item's root.
   * @param onItemUpdate Method that will trigger an update projection. This should be called
   *                     when the item changes its size. (e.g. The item has a button which
   *                     expands item's height showing new content).
   */
  rowRenderer(
    index: number,
    rowRef: (rowRef: React.ReactInstance) => void,
    onItemUpdate: () => void,
  ): React.ReactNode;

  /**
   * Cache key on VirtualScrollerCacheService.
   *
   * @defaultValue `VirtualScrollerCacheService.getNextId()`
   */
  cacheKey?: string;

  /**
   * Number of rows that will be rendered before and after the
   * ones that are shown in the viewport.
   *
   * @defaultValue 2
   */
  overscanRowCount?: number;

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

function isWindow(targetView: VirtualScrollerTargetView) {
  return window === targetView;
}

function scrollTo(targetView: VirtualScrollerTargetView, x: number, y: number) {
  window.requestAnimationFrame(() => {
    targetView.scrollTo(x, y);
  });
}

function VirtualScrollerHooks({
  targetView = window,
  initialScrollPosition = 0,
  cacheKey = VirtualScrollerCacheService.getNextId(),
  rowCount = 0,
  overscanRowCount = 2,
  defaultRowHeight = 0,
  rowRenderer = () => null,
  scrollRestoration = false,
}: IVirtualScrollerProps) {
  const [state, setState] = useState<IVirtualScrollerState>(() => ({
    ...defaultVirtualScrollerState,
  }));
  const cache = VirtualScrollerCacheService.getCache(cacheKey);
  const listDivRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<{ [key: number]: IVirtualScrollerRowRef }>({});

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
        ? (targetView as Window).scrollY
        : (targetView as Element).scrollTop;

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
      const hasRef = !!rowRefs.current[index];

      if (hasRef) {
        window.requestAnimationFrame(() => {
          const ref = rowRefs.current[index];

          if (ref && ref.DOMNode) {
            cache[index] = (ref.DOMNode as Element).getBoundingClientRect().height;
          }
        });
      }

      return height || defaultRowHeight;
    },
    [cache, defaultRowHeight],
  );

  const updateProjection = useCallback(
    () => {
      if (!rowCount) {
        return;
      }

      const listDiv = listDivRef.current;

      const viewport = isWindow(targetView)
        ? {
            height: (targetView as Window).innerHeight,
            scrollY: (targetView as Window).scrollY - listDiv.offsetTop,
          }
        : {
            height: (targetView as Element).clientHeight,
            scrollY: (targetView as Element).scrollTop - listDiv.offsetTop,
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

      for (let i = 0; i < rowCount; i++) {
        const prevSum = itemsHeightSum;
        itemsHeightSum += calculateRowHeight(i);

        if (itemsHeightSum >= viewport.scrollY && isNaN(firstIndex)) {
          paddingTop = prevSum;
          firstIndex = i - overscanRowCount;

          if (firstIndex < 0) {
            firstIndex = 0;
          }

          for (let j = firstIndex; j < i; j++) {
            paddingTop -= calculateRowHeight(j);
          }
        }

        if (
          (itemsHeightSum >= visibleItemsMaxTop && !lastIndex) ||
          (i === rowCount - 1 && !lastIndex)
        ) {
          lastIndex = i + overscanRowCount;
          visibleItemsHeight = itemsHeightSum;

          if (lastIndex >= rowCount) {
            lastIndex = rowCount - 1;
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
    [calculateRowHeight, overscanRowCount, rowCount, targetView],
  );

  useEffect(
    () => {
      if (!targetView) {
        return;
      }

      function onResizeListener() {
        updateProjection();
      }

      function onScrollListener() {
        updateProjection();
      }

      window.addEventListener("resize", onResizeListener);
      targetView.addEventListener("scroll", onScrollListener);

      return () => {
        window.removeEventListener("resize", onResizeListener);
        targetView.removeEventListener("scroll", onScrollListener);
      };
    },
    [targetView, updateProjection],
  );

  useEffect(
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

      return () => {
        saveScrollPosition();
      };
    },
    [cacheKey, restoreScroll, saveScrollPosition],
  );

  function createRowRefListener(index: number) {
    return (ref: React.ReactInstance) => setRowRef(index, ref);
  }

  function setRowRef(index: number, ref: React.ReactInstance) {
    if (!ref) {
      rowRefs.current[index] = null;
      return;
    }

    rowRefs.current[index] = {
      ref,
      DOMNode: findDOMNode(ref),
    };
  }

  function onItemUpdate(index: number) {
    if (targetView) {
      updateProjection();
    }
  }

  const projection = [];

  if (rowCount) {
    for (let i = state.firstIndex; i <= state.lastIndex; i++) {
      projection[projection.length] = rowRenderer(i, createRowRefListener(i), () =>
        onItemUpdate(i),
      );
    }
  }

  return (
    <div
      ref={listDivRef}
      style={{
        paddingBottom: state.paddingBottom,
        paddingTop: state.paddingTop,
      }}
    >
      {projection}
    </div>
  );
}

export const VirtualScroller = memo(VirtualScrollerHooks);
