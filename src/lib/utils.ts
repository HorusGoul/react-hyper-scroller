export type HyperScrollerTargetView = React.RefObject<HTMLElement> | Window;

export const defaultHyperScrollerState = {
  firstIndex: 0,
  lastIndex: 0,
  paddingBottom: 0,
  paddingTop: 0,
  isInitialState: true,
};

export function isWindow(
  targetView: HyperScrollerTargetView,
): targetView is Window {
  return window === targetView;
}

export function isHTMLElement(view: HTMLElement | Window): view is HTMLElement {
  return window !== view;
}

export function getViewScrollHeight(view: HTMLElement | Window) {
  return isHTMLElement(view) ? view.scrollHeight : document.body.scrollHeight;
}

export function getViewHeight(view: HTMLElement | Window) {
  return isHTMLElement(view) ? view.clientHeight : window.innerHeight;
}

export function scrollTo(
  targetView: HyperScrollerTargetView,
  x: number,
  y: number,
): Promise<void> {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => {
      const view = isWindow(targetView) ? targetView : targetView.current;

      if (!view) {
        return resolve();
      }

      if (view === window) {
        view.scrollTo(x, y);
        return resolve();
      }

      if (isHTMLElement(view)) {
        view.scrollTop = y;
        view.scrollLeft = x;
        return resolve();
      }
    });
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

export function sanitizeReactKey(key: React.Key | null) {
  if (key) {
    key = key.toString().slice(2);

    if (key === '') {
      return null;
    }

    return key;
  }

  return null;
}
