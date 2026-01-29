export function serializeSvgToDataUrl(svgElement: SVGElement): string {
  const svgData = new XMLSerializer().serializeToString(svgElement);
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  return URL.createObjectURL(svgBlob);
}

export function exportToPng(containerRef: React.RefObject<HTMLDivElement | null>, filename: string = 'graph.png'): void {
  if (!containerRef.current) {
    console.warn('Export failed: container ref is null');
    return;
  }

  const svgElement = containerRef.current.querySelector('svg');
  if (!svgElement) {
    console.warn('Export failed: no SVG element found');
    return;
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.warn('Export failed: could not get canvas context');
    return;
  }

  const svgRect = svgElement.getBoundingClientRect();
  canvas.width = svgRect.width;
  canvas.height = svgRect.height;

  const img = new Image();
  const svgUrl = serializeSvgToDataUrl(svgElement);

  img.onload = () => {
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(svgUrl);

    canvas.toBlob((blob) => {
      if (!blob) {
        console.warn('Export failed: could not create blob');
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  img.onerror = () => {
    console.error('Export failed: could not load SVG image');
    URL.revokeObjectURL(svgUrl);
  };

  img.src = svgUrl;
}
