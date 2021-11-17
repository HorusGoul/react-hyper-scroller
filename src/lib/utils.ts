export type VirtualScrollerTargetView = React.RefObject<HTMLElement> | Window;

export const defaultVirtualScrollerState = {
  firstIndex: 0,
  lastIndex: 0,
  paddingBottom: 0,
  paddingTop: 0,
};

export function isWindow(
  targetView: VirtualScrollerTargetView,
): targetView is Window {
  return window === targetView;
}

export function isHTMLElement(view: HTMLElement | Window): view is HTMLElement {
  return window !== view;
}

export function scrollTo(
  targetView: VirtualScrollerTargetView,
  x: number,
  y: number,
) {
  window.requestAnimationFrame(() => {
    const view = isWindow(targetView) ? targetView : targetView.current;

    if (!view) {
      return;
    }

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

export function combineRefs<T>(
  ...refs: (React.Ref<T> | undefined)[]
): React.Ref<T> {
  return (instance: T) => {
    for (const ref of refs) {
      if (!ref) {
        continue;
      }

      if (typeof ref === 'function') {
        ref(instance);
      } else {
        (ref as React.MutableRefObject<unknown>).current = instance;
      }
    }
  };
}
