import * as React from 'react';
import * as ReactDOM from 'react-dom';

function App() {
  return (
    <>
      <div>Virtual Scroller Demos</div>

      <ul>
        <li>
          <a href="/demos/scroll-restoration.html">Scroll restoration</a>
        </li>
      </ul>
    </>
  );
}

render(<App />);

export function render(root: JSX.Element) {
  ReactDOM.render(root, document.getElementById('root'));
}
