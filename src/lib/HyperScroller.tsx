import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
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
  sanitizeReactKey,
  getViewScrollHeight,
  getViewHeight,
} from './utils';
import { HyperScrollerCache } from './HyperScrollerCache';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const HyperScrollerContext = createContext<HyperScrollerController>(null);

interface HyperScroller
  extends React.ForwardRefExoticComponent<
    HyperScrollerProps & React.RefAttributes<unknown>
  > {
  Item: typeof HyperScrollerItem;
}

interface HyperScrollerConfig {
  /**
   * Estimated height that will be used on initial
   * render for each item.
   */
  estimatedItemHeight: number;

  /**
   * Cache
   *
   * @defaultValue `new HyperScrollerCache(nextInt)`
   */
  cache?: HyperScrollerCache;

  /**
   * Number of items that will be rendered before and after the
   * ones that are shown in the viewport.
   *
   * The minimum value is 2.
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
   * Scroll restoration depends on the `cache` as it
   * will retrieve the latest scroll position from the cache.
   *
   * @defaultValue false
   */
  scrollRestoration?: boolean;

  /**
   * Measure the height of the items and cache it.
   *
   * @defaultValue true
   */
  measureItems?: boolean;
}

interface UseHyperScrollerControllerParams extends HyperScrollerConfig {
  itemCount: number;
}

interface ScrollToItemOptions {
  /**
   * Adjustment to the final scroll position.
   *
   * @defaultValue 0
   */
  top?: number;
}

interface HyperScrollerController {
  createItemRef(index: number): React.RefObject<HTMLElement>;
  updateProjection(): void;
  scheduleUpdateProjection(): void;
  resetState(): void;
  scrollToInitialPosition(): void;
  restoreScrollPosition(cache: HyperScrollerCache): void;
  saveScrollPosition(cache: HyperScrollerCache): void;
  scrollToItem(itemKey: string, options?: ScrollToItemOptions): void;

  // State
  state: {
    paddingTop: number;
    paddingBottom: number;
    firstIndex: number;
    lastIndex: number;
    isInitialState: boolean;
  };

  scrollerRef: React.RefObject<HTMLDivElement>;

  cache: HyperScrollerCache;

  scrollRestoration: boolean;

  measureItems: boolean;
}

function useHyperScrollerController({
  estimatedItemHeight,
  itemCount = 0,
  cache,
  targetView = window,
  overscanItemCount = 2,
  initialScrollPosition = 0,
  scrollRestoration = false,
  measureItems = true,
}: UseHyperScrollerControllerParams): HyperScrollerController {
  overscanItemCount = Math.max(overscanItemCount, 2);

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
  const [internalCache, setInternalCache] = useState(
    () => cache ?? HyperScrollerCache.getOrCreateCache(),
  );

  internalCache.estimatedItemHeight = estimatedItemHeight;

  useEffect(() => {
    let newInternalCache = cache;

    if (!newInternalCache) {
      newInternalCache = HyperScrollerCache.getOrCreateCache();
    }

    setInternalCache(newInternalCache);
  }, [cache]);

  // Scroll restoration
  const scrollToInitialPosition = useCallback(() => {
    scrollTo(targetView, 0, initialScrollPosition);
  }, [targetView, initialScrollPosition]);

  const restoreScrollPosition = useCallback(
    (cache: HyperScrollerCache) => {
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
    (cache: HyperScrollerCache) => {
      cache.scrollPosition = getScrollPosition();
    },
    [getScrollPosition],
  );

  const scrollToItemRAFRef = useRef<number>();

  useEffect(() => {
    return () => {
      if (scrollToItemRAFRef.current) {
        window.cancelAnimationFrame(scrollToItemRAFRef.current);
      }
    };
  }, []);

  const scrollToItem = useCallback(
    (key: string, { top = 0 }: ScrollToItemOptions = {}) => {
      const view = isWindow(targetView) ? targetView : targetView.current;

      if (!view) {
        return;
      }

      const item = internalCache.getItemByKey(key);
      const position = item?.position;

      if (!item || position === undefined) {
        return;
      }

      const recursiveScrollToRef = () => {
        scrollToItemRAFRef.current = window.requestAnimationFrame(() => {
          const ref = itemsRefs.current[item.index];

          if (!ref) {
            return recursiveScrollToRef();
          }

          const element = ref.current;

          if (!element) {
            return recursiveScrollToRef();
          }

          const box = element.getBoundingClientRect();

          const currentPosition = getScrollPosition();
          const newPosition = currentPosition + box.top - top;
          const viewScrollHeight = getViewScrollHeight(view);
          const viewHeight = getViewHeight(view);

          if (newPosition < 0 && currentPosition === 0) {
            return;
          }

          if (newPosition > viewScrollHeight - viewHeight) {
            scrollTo(targetView, 0, newPosition);
            return;
          }

          if (box.top !== top) {
            scrollTo(targetView, 0, newPosition).then(() =>
              recursiveScrollToRef(),
            );
          }
        });
      };

      scrollTo(targetView, 0, position).then(() => recursiveScrollToRef());
    },
    [targetView, internalCache, getScrollPosition],
  );

  const createItemRef = useCallback((index: number) => {
    const ref = itemsRefs.current[index] ?? React.createRef<HTMLElement>();
    itemsRefs.current[index] = ref;
    return ref;
  }, []);

  const calculateRowHeight = useCallback(
    (index: number) => {
      const item = internalCache.getItemByIndex(index);

      if (!item || !item.measured) {
        return internalCache.estimatedItemHeight;
      }

      return item.height;
    },
    [internalCache],
  );

  // We save the previous scroll positions to prevent infinite loops.
  // These loops are usually produced by having a scrollY position that renders
  // an item. The height of that item will change the scrollY, triggering the updateProjection
  // function again, but in this case, the scrollY won't render that item.
  // When this happens, the scrollY returns back to the previous one, which
  // triggers the updateProjection function again to render the same item that we just removed.
  //
  // To prevent this, we save the previous scroll positions and if the scrollY is found in this
  // stack of four positions, we cancel the update.
  const prevScrollPositionsRef = useRef<[number, number, number, number]>([
    -1, -1, -1, -1,
  ]);

  useEffect(() => {
    // Reset the previous scroll positions when the cache is replaced or the item count changes.
    prevScrollPositionsRef.current = [-1, -1, -1, -1];
  }, [internalCache, itemCount]);

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

    // Count the number of times the scrollY appears in the loopCountRef.current
    let times = 0;

    for (let i = 0; i < prevScrollPositionsRef.current.length; i++) {
      if (prevScrollPositionsRef.current[i] === viewport.scrollY) {
        times++;
      }
    }

    if (times >= 2) {
      // Infinite loop detected, cancel update.
      return;
    }

    prevScrollPositionsRef.current.pop();
    prevScrollPositionsRef.current.unshift(viewport.scrollY);

    let firstIndex: number | undefined;
    let lastIndex: number | undefined;
    let paddingTop = 0;
    let paddingBottom = 0;

    if (measureItems) {
      const item = internalCache.getItemByScrollPosition(viewport.scrollY);
      let availableHeight = viewport.height;

      if (!item) {
        return;
      }

      firstIndex = Math.max(item.index - overscanItemCount, 0);

      const firstItem = internalCache.getItemByIndex(firstIndex);

      if (firstItem) {
        paddingTop = firstItem.position;
      } else {
        paddingTop = 0;
      }

      // Calculate the lastIndex based on the available height by checking the item heights
      // and subtracting the estimated item height
      for (let i = item.index; i < itemCount; i++) {
        const itemHeight = calculateRowHeight(i);
        availableHeight -= itemHeight;

        if (availableHeight < 0) {
          lastIndex = i;
          break;
        }
      }

      if (lastIndex === undefined) {
        lastIndex = Math.max(itemCount - 1, 0);
      } else {
        lastIndex = Math.min(lastIndex + overscanItemCount, itemCount - 1);
      }

      if (lastIndex === itemCount - 1) {
        paddingBottom = 0;
      } else {
        const lastProjectionItem = internalCache.getItemByIndex(lastIndex);
        const lastListItem = internalCache.getItemByIndex(itemCount - 1);

        if (lastProjectionItem && lastListItem) {
          const viewTopToProjectionBottomDistance =
            lastProjectionItem.position + lastProjectionItem.height;
          const maxHeight = lastListItem.position + lastListItem.height;

          paddingBottom = maxHeight - viewTopToProjectionBottomDistance;
        } else {
          paddingBottom = 0;
        }
      }
    } else {
      // When we're not measuring items, we assume that all the items have the same height
      const totalItemsHeightSum = itemCount * internalCache.estimatedItemHeight;
      const realEstimatedItemHeight = totalItemsHeightSum / itemCount;

      firstIndex = Math.max(
        Math.floor(viewport.scrollY / realEstimatedItemHeight) -
          overscanItemCount,
        0,
      );
      lastIndex = Math.min(
        Math.ceil(
          (viewport.scrollY + viewport.height) / realEstimatedItemHeight,
        ) + overscanItemCount,
        itemCount - 1,
      );
      paddingTop = firstIndex * realEstimatedItemHeight;

      const itemsLeft = itemCount - lastIndex - 1;
      paddingBottom = itemsLeft * realEstimatedItemHeight;
    }

    setState({
      firstIndex: firstIndex ?? 0,
      lastIndex: lastIndex ?? 0,
      paddingBottom,
      paddingTop,
      isInitialState: false,
    });
  }, [
    internalCache,
    overscanItemCount,
    itemCount,
    targetView,
    measureItems,
    calculateRowHeight,
  ]);

  const scheduleUpdateProjectionRAFRef = useRef<number>();

  const scheduleUpdateProjection = useCallback(() => {
    if (scheduleUpdateProjectionRAFRef.current) {
      window.cancelAnimationFrame(scheduleUpdateProjectionRAFRef.current);
    }

    scheduleUpdateProjectionRAFRef.current =
      window.requestAnimationFrame(updateProjection);
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

      if (scheduleUpdateProjectionRAFRef.current) {
        window.cancelAnimationFrame(scheduleUpdateProjectionRAFRef.current);
      }
    };
  }, [targetView, scheduleUpdateProjection]);

  return {
    // State
    state,

    // Functions
    updateProjection,
    scheduleUpdateProjection,
    resetState,

    // Scroll
    scrollRestoration,
    scrollToInitialPosition,
    restoreScrollPosition,
    saveScrollPosition,
    scrollToItem,

    // Refs
    scrollerRef,
    createItemRef,

    // Cache
    cache: internalCache,
    measureItems,
  };
}

interface HyperScrollerProps extends HyperScrollerConfig {
  children: React.ReactNode;

  /**
   * Before the first render of the projection, the scroller will render part of the list
   * as placeholders.
   *
   * This is the number of items that will be rendered before the first
   * projection is calculated.
   */
  itemsToShowBeforeFirstProjection?: number;
}

export interface HyperScrollerRef {
  scrollToItem: HyperScrollerController['scrollToItem'];
}

export function useHyperScrollerRef() {
  return useRef<HyperScrollerRef>(null);
}

const HyperScroller = forwardRef<HyperScrollerRef, HyperScrollerProps>(
  function HyperScroller(
    { children, itemsToShowBeforeFirstProjection = 1, ...params },
    ref,
  ) {
    const items = React.Children.toArray(children);
    const itemCount = items.length;

    const controller = useHyperScrollerController({
      itemCount,
      ...params,
    });
    const {
      createItemRef,
      updateProjection,
      resetState,
      cache,
      scrollerRef,
      saveScrollPosition,
      restoreScrollPosition,
      scrollToInitialPosition,
      scrollRestoration,
      scrollToItem,
    } = controller;

    const { firstIndex, paddingBottom, paddingTop, isInitialState } =
      controller.state;
    let { lastIndex } = controller.state;

    useEffect(() => {
      React.Children.forEach(children, (child, index) => {
        let key = `@@${index}`;

        if (isItemChildWithProps(child)) {
          key = String(child.props.hyperId ?? child.key ?? key);
        }

        const item = cache.getItemByKey(key);

        if (!item) {
          cache.setItem(key, index, cache.estimatedItemHeight);
          return;
        }

        if (item) {
          item.index = index;
        }
      });
    }, [children, cache]);

    useEffect(() => {
      resetState();
      updateProjection();
    }, [cache.key, updateProjection, resetState]);

    useLayoutEffect(() => {
      if (isInitialState) {
        return;
      }

      if (scrollRestoration) {
        restoreScrollPosition(cache);
      } else {
        scrollToInitialPosition();
      }

      return () => {
        saveScrollPosition(cache);
      };
    }, [
      isInitialState,
      cache,
      scrollRestoration,
      scrollToInitialPosition,
      saveScrollPosition,
      restoreScrollPosition,
    ]);

    useImperativeHandle(
      ref,
      () => ({
        scrollToItem,
      }),
      [scrollToItem],
    );

    const projection: JSX.Element[] = [];

    if (itemCount) {
      if (isInitialState && itemsToShowBeforeFirstProjection) {
        lastIndex = Math.min(
          firstIndex + itemsToShowBeforeFirstProjection,
          itemCount,
        );
      }

      for (let index = firstIndex; index <= lastIndex; index++) {
        const item = items[index];
        const ref = createItemRef(index);
        let key = `@@${index}`;
        let projectionItem: JSX.Element;

        function getReactKey() {
          let reactKey =
            typeof item === 'object' && 'key' in item ? String(item.key) : null;

          if (reactKey && !reactKey.includes('$')) {
            reactKey = null;
          }

          if (!reactKey) {
            reactKey = key;
          }

          return reactKey;
        }

        if (isHyperScrollerItemChild(item)) {
          key = getReactKey();

          projectionItem = React.cloneElement(item, {
            ...item.props,
            index,
            ref: combineRefs(item.props.ref, ref),
            key,
            hyperId: item.props.hyperId ?? sanitizeReactKey(item.key) ?? key,
          });
        } else if (isItemChildWithProps(item)) {
          // eslint-disable-next-line
          let { hyperId, ...props } = item.props;
          key = getReactKey();
          hyperId = hyperId ?? sanitizeReactKey(item.key) ?? key;

          const clonedItem = React.cloneElement(item, {
            ...props,
          });

          projectionItem = (
            <HyperScrollerItem
              key={key}
              as="div"
              index={index}
              hyperId={hyperId}
              ref={createItemRef(index)}
            >
              {clonedItem}
            </HyperScrollerItem>
          );
        } else {
          projectionItem = (
            <HyperScrollerItem
              key={key}
              as="div"
              index={index}
              hyperId={key}
              ref={createItemRef(index)}
            >
              {item}
            </HyperScrollerItem>
          );
        }

        projection[projection.length] = projectionItem;
      }
    }

    return (
      <HyperScrollerContext.Provider value={controller}>
        <div ref={scrollerRef}>
          <div style={{ height: paddingTop }} />
          {projection}
          <div style={{ height: paddingBottom }} />
        </div>
      </HyperScrollerContext.Provider>
    );
  },
) as HyperScroller;

HyperScroller.displayName = 'HyperScroller';

interface HyperScrollerItemProps {
  children: React.ReactNode;

  /**
   * You can use `hyperId` or React's `key`. These will allow you to use the advanced
   * features of HyperScroller such as scrolling to an specific item without knowing its
   * index.
   *
   * @defaultValue `key` or `@@${index}`
   */
  hyperId?: string;
  as?: React.ElementType;
  index?: number;
}

const HyperScrollerItem = forwardRef<HTMLElement, HyperScrollerItemProps>(
  function HyperScrollerItem(
    { children, as: Component = 'div', index = -1, hyperId = `@@${index}` },
    forwardedRef,
  ) {
    const { cache, measureItems } = useContext(HyperScrollerContext);
    const innerRef = useRef<HTMLElement>(null);

    useLayoutEffect(() => {
      if (!measureItems) {
        return;
      }

      const element = innerRef.current;

      if (!element) {
        return;
      }

      let unmounted = false;

      const resizeObserver = new ResizeObserver((entries) => {
        if (unmounted) {
          return;
        }

        const entry = entries[0];

        if (entry.target !== element || entry.target.parentNode === null) {
          return;
        }

        const { height } = entry.contentRect;
        cache.setItem(hyperId, index, height, true);
      });

      resizeObserver.observe(element);

      return () => {
        unmounted = true;
        resizeObserver.disconnect();
      };
    }, [innerRef, cache, index, hyperId, measureItems]);

    return (
      <Component ref={combineRefs(innerRef, forwardedRef)}>
        {children}
      </Component>
    );
  },
);

HyperScrollerItem.displayName = 'HyperScrollerItem';

HyperScroller.Item = HyperScrollerItem;

export default HyperScroller;

function isHyperScrollerItemChild(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  item: any,
): item is React.ReactElement<
  React.ComponentPropsWithRef<typeof HyperScrollerItem>
> {
  return item?.type?.displayName === HyperScrollerItem.displayName;
}

function isItemChildWithProps(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  item: any,
): item is React.ReactElement<unknown> {
  return item && item.type?.displayName !== HyperScrollerItem.displayName;
}
