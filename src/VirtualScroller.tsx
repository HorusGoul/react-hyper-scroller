import * as React from "react";
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
export class VirtualScroller extends React.Component<IVirtualScrollerProps, IVirtualScrollerState> {
  public static defaultProps: IVirtualScrollerProps = {
    cacheKey: VirtualScrollerCacheService.getNextId(),
    defaultRowHeight: 0,
    overscanRowCount: 2,
    rowCount: 0,
    rowRenderer: () => null,
    initialScrollPosition: 0,
    targetView: window,
  };

  public state: IVirtualScrollerState = defaultVirtualScrollerState;

  private listDiv: HTMLDivElement;
  private rowRefs: { [key: number]: IVirtualScrollerRowRef } = {};

  public componentDidMount() {
    if (this.props.targetView) {
      this.addEventListeners();
      this.updateProjection();
      this.restoreScroll();
    }
  }

  public componentWillUnmount() {
    if (this.props.targetView) {
      this.removeEventListeners();
      this.saveScrollPosition();
    }
  }

  public componentDidUpdate(prevProps: IVirtualScrollerProps) {
    if (this.props !== prevProps) {
      if (prevProps.targetView !== this.props.targetView) {
        if (prevProps.targetView !== null) {
          this.removeEventListeners(prevProps.targetView);
        }

        if (this.props.targetView) {
          this.addEventListeners();
        }
      }

      if (this.props.targetView) {
        if (prevProps.cacheKey !== this.props.cacheKey) {
          this.saveScrollPosition(prevProps.cacheKey);
          this.setState(
            {
              ...defaultVirtualScrollerState,
            },
            () => this.restoreScroll(),
          );
        }

        this.updateProjection();
      }
    }
  }

  public render() {
    const { rowRenderer, rowCount } = this.props;
    const { firstIndex, lastIndex, paddingBottom, paddingTop } = this.state;

    const projection = [];

    if (rowCount) {
      for (let i = firstIndex; i <= lastIndex; i++) {
        projection[projection.length] = rowRenderer(
          i,
          this.createRowRefListener(i),
          this.createItemUpdateListener(i),
        );
      }
    }

    return (
      <div
        ref={ref => (this.listDiv = ref)}
        style={{
          paddingBottom,
          paddingTop,
        }}
      >
        {projection}
      </div>
    );
  }

  private onResizeListener = (e: Event) => this.onResize(e);
  private onScrollListener = (e: Event) => this.onScroll(e);

  private addEventListeners(targetView: VirtualScrollerTargetView = this.props.targetView) {
    window.addEventListener("resize", this.onResizeListener, false);
    targetView.addEventListener("scroll", this.onScrollListener, false);
  }

  private removeEventListeners(targetView: VirtualScrollerTargetView = this.props.targetView) {
    window.removeEventListener("resize", this.onResizeListener);
    targetView.removeEventListener("scroll", this.onScrollListener);
  }

  private updateProjection(props: IVirtualScrollerProps = this.props) {
    const { rowCount, overscanRowCount, targetView } = props;

    if (!rowCount) {
      return;
    }

    const viewport = this.targetViewIsWindow()
      ? {
          height: (targetView as Window).innerHeight,
          scrollY: (targetView as Window).scrollY - this.listDiv.offsetTop,
        }
      : {
          height: (targetView as Element).clientHeight,
          scrollY: (targetView as Element).scrollTop - this.listDiv.offsetTop,
        };

    if (viewport.scrollY < 0) {
      viewport.scrollY = 0;
    }

    const visibleItemsMaxTop = viewport.scrollY + viewport.height;
    let visibleItemsHeight = 0;
    let itemsHeightSum = 0;
    let firstIndex;
    let lastIndex;
    let paddingTop = 0;
    let paddingBottom = 0;

    for (let i = 0; i < rowCount; i++) {
      const prevSum = itemsHeightSum;
      itemsHeightSum += this.calculateRowHeight(i);

      if (itemsHeightSum >= viewport.scrollY && isNaN(firstIndex)) {
        paddingTop = prevSum;
        firstIndex = i - overscanRowCount;

        if (firstIndex < 0) {
          firstIndex = 0;
        }

        for (let j = firstIndex; j < i; j++) {
          paddingTop -= this.calculateRowHeight(j);
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
          visibleItemsHeight += this.calculateRowHeight(j);
        }
      }
    }

    paddingBottom = itemsHeightSum - visibleItemsHeight;

    if (paddingBottom < 0) {
      paddingBottom = 0;
    }

    this.setState({
      firstIndex,
      lastIndex,
      paddingBottom,
      paddingTop,
    });
  }

  private createRowRefListener(index: number) {
    return (ref: React.ReactInstance) => this.setRowRef(index, ref);
  }

  private setRowRef(index: number, ref: React.ReactInstance) {
    if (!ref) {
      this.rowRefs[index] = null;
      return;
    }

    this.rowRefs[index] = {
      ref,
      DOMNode: findDOMNode(ref),
    };
  }

  private calculateRowHeight(index: number) {
    const { cacheKey, defaultRowHeight } = this.props;
    const cache = VirtualScrollerCacheService.getCache(cacheKey);
    const height = cache[index];
    const hasRef = !!this.rowRefs[index];

    if (hasRef) {
      window.requestAnimationFrame(() => {
        // Request ref again just in case it has been removed.
        const ref = this.rowRefs[index];

        if (ref && ref.DOMNode) {
          cache[index] = (ref.DOMNode as Element).getBoundingClientRect().height;
        }
      });
    }

    return height || defaultRowHeight;
  }

  private onScroll(_e: Event) {
    this.updateProjection();
  }

  private onResize(_e: Event) {
    this.updateProjection();
  }

  private saveScrollPosition(cacheKey: string = this.props.cacheKey) {
    const cache = VirtualScrollerCacheService.getCache(cacheKey);
    cache.scrollPosition = this.getScrollPosition();
  }

  private restoreScroll() {
    const { targetView, cacheKey, initialScrollPosition } = this.props;
    const cache = VirtualScrollerCacheService.getCache(cacheKey);
    const scrollPosition = cache.scrollPosition || initialScrollPosition;

    window.requestAnimationFrame(() => targetView.scrollTo(0, scrollPosition));
  }

  private getScrollPosition() {
    const { initialScrollPosition, targetView } = this.props;
    const y = this.targetViewIsWindow()
      ? (targetView as Window).scrollY
      : (targetView as Element).scrollTop;

    return y < initialScrollPosition ? initialScrollPosition : y;
  }

  private createItemUpdateListener(index: number) {
    return () => this.onItemUpdate(index);
  }

  private onItemUpdate(_index: number): void {
    const { targetView } = this.props;

    if (targetView) {
      this.updateProjection();
    }
  }

  private targetViewIsWindow() {
    return window === this.props.targetView;
  }
}
