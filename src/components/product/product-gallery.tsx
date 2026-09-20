"use client";

import { useState } from "react";
import Image from "next/image";

interface GalleryImage {
  id: string;
  url: string;
  altText: string;
}

export function ProductGallery({ images, productName }: { images: GalleryImage[]; productName: string }) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState({ x: 50, y: 50, active: false });
  const list = images.length > 0 ? images : [{ id: "placeholder", url: "/placeholder-product.svg", altText: productName }];

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoom({ x, y, active: true });
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row-reverse">
      <div
        className="relative aspect-[3/4] flex-1 overflow-hidden rounded-lg bg-cream"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setZoom((z) => ({ ...z, active: false }))}
      >
        <Image
          src={list[active]!.url}
          alt={list[active]!.altText || productName}
          fill
          priority
          sizes="(max-width: 1024px) 90vw, 45vw"
          className="object-cover transition-transform duration-200 ease-out"
          style={
            zoom.active
              ? { transform: "scale(1.6)", transformOrigin: `${zoom.x}% ${zoom.y}%` }
              : undefined
          }
        />
      </div>
      {list.length > 1 && (
        <div className="flex gap-2 overflow-x-auto sm:w-20 sm:flex-col sm:overflow-visible">
          {list.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActive(i)}
              className={`relative aspect-[3/4] w-16 flex-shrink-0 overflow-hidden rounded-md border-2 sm:w-full ${
                i === active ? "border-gold" : "border-transparent"
              }`}
              aria-label={`View image ${i + 1}`}
            >
              <Image src={img.url} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
