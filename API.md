# API

Example:

```tsx
function List() {
  const listController = useVirtualScroller({
    estimatedItemHeight: 50,
  });

  return (
    <VirtualScroller {...listController}>
      <VirtualScroller.Item as="div" id="heading-1">
        <h1>Heading</h1>

        <p>Paragraph</p>
      </VirtualScroller.Item>

      {items.map((item) => (
        <VirtualScroller.Item id={item.id}>
          <p>{item.text}</p>
        </VirtualScroller.Item>
      ))}

      <VirtualScroller.Item as="h2">Sub-heading</VirtualScroller.Item>

      <VirtualScroller.Item as="p">Paragraph</VirtualScroller.Item>
    </VirtualScroller>
  );
}
```
