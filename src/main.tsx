import * as React from 'react';
import * as ReactDOM from 'react-dom';

function App() {
  return (
    <>
      <div>Virtual Scroller Demos</div>

      <ul>
        <li>
          <a href="/demos/basic.html">Basic</a>
        </li>
        <li>
          <a href="/demos/basic-static-height.html">Basic - Static Height</a>
        </li>
        <li>
          <a href="/demos/scroll-restoration.html">Scroll restoration</a>
        </li>
        <li>
          <a href="/demos/different-target.html">Different target</a>
        </li>
        <li>
          <a href="/demos/scroll-to-item.html">Scroll to item</a>
        </li>
        <li>
          <a href="/demos/scroll-to-item-target.html">
            Scroll to item - With a different target
          </a>
        </li>
        <li>
          <a href="/demos/5000-elements.html">5000 elements</a>
        </li>
      </ul>
    </>
  );
}

render(<App />);

export function render(root: JSX.Element) {
  ReactDOM.render(root, document.getElementById('root'));
}
