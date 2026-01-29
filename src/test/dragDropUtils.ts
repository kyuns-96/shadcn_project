export function createMockDataTransfer(data: Record<string, string> = {}): DataTransfer {
  const store: Record<string, string> = { ...data };
  return {
    setData: (type: string, value: string) => { store[type] = value; },
    getData: (type: string) => store[type] ?? '',
    clearData: () => { for (const k of Object.keys(store)) delete store[k]; },
    effectAllowed: 'copy',
    dropEffect: 'none',
    types: Object.keys(store),
    files: [] as unknown as FileList,
    items: [] as unknown as DataTransferItemList,
    setDragImage: () => {},
  } as DataTransfer;
}
