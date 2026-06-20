"use client";

import { useRef, useState } from "react";
import { GripVertical, ImagePlus, Link2, Loader2, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";

export type ImageItem = { uid: string; url: string; alt: string };

let imgCounter = 0;
export const imageUid = () => `img${Date.now()}_${imgCounter++}`;

type SignResponse = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
};

async function uploadToCloudinary(file: File): Promise<string> {
  const signRes = await fetch("/api/uploads/sign", { method: "POST" });
  if (signRes.status === 503) throw new Error("NOT_CONFIGURED");
  if (!signRes.ok)
    throw new Error((await signRes.json().catch(() => ({})))?.error ?? "Sign failed");

  const sign = (await signRes.json()) as SignResponse;
  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sign.apiKey);
  form.append("timestamp", String(sign.timestamp));
  form.append("folder", sign.folder);
  form.append("signature", sign.signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error("Upload failed");
  const data = (await res.json()) as { secure_url: string };
  return data.secure_url;
}

export function ImageGallery({
  value,
  onChange,
  compact = false,
}: {
  value: ImageItem[];
  onChange: (next: ImageItem[]) => void;
  compact?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [urlMode, setUrlMode] = useState(false);
  const [urlValue, setUrlValue] = useState("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  function add(url: string) {
    onChange([...value, { uid: imageUid(), url, alt: "" }]);
  }

  function remove(uid: string) {
    onChange(value.filter((i) => i.uid !== uid));
  }

  function setAlt(uid: string, alt: string) {
    onChange(value.map((i) => (i.uid === uid ? { ...i, alt } : i)));
  }

  function reorder(from: number, to: number) {
    if (from === to) return;
    const next = [...value];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  }

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        try {
          const url = await uploadToCloudinary(file);
          add(url);
        } catch (err) {
          if (err instanceof Error && err.message === "NOT_CONFIGURED") {
            toast.info("Uploads not configured", "Add images by URL instead.");
            setUrlMode(true);
            break;
          }
          toast.error("Upload failed", file.name);
        }
      }
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function addByUrl() {
    const url = urlValue.trim();
    if (!url) return;
    add(url);
    setUrlValue("");
  }

  const thumb = compact ? "size-16" : "size-24";

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {value.map((img, i) => (
            <div
              key={img.uid}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex !== null) reorder(dragIndex, i);
                setDragIndex(null);
              }}
              className={cn(
                "group bg-muted relative overflow-hidden rounded-lg border",
                thumb,
                dragIndex === i && "opacity-50",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.alt || "Product image"}
                className="size-full object-cover"
              />
              {i === 0 && (
                <span className="bg-brand text-brand-foreground absolute top-1 left-1 rounded px-1 text-[0.6rem] font-medium">
                  Cover
                </span>
              )}
              <span className="absolute top-1 right-1 cursor-grab text-white opacity-0 drop-shadow group-hover:opacity-100">
                <GripVertical className="size-4" />
              </span>
              <button
                type="button"
                onClick={() => remove(img.uid)}
                className="bg-destructive text-destructive-foreground absolute right-1 bottom-1 rounded-full p-1 opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="Remove image"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {!compact && value.length > 0 && (
        <div className="space-y-2">
          {value.map((img) => (
            <div key={img.uid} className="flex items-center gap-2">
              <span className="text-muted-foreground w-10 truncate text-xs">
                {img.url.split("/").pop()}
              </span>
              <Input
                value={img.alt}
                onChange={(e) => setAlt(img.uid, e.target.value)}
                placeholder="Alt text (optional)"
                className="h-8"
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => onFiles(e.target.files)}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? <Loader2 className="animate-spin" /> : <ImagePlus />}
          {uploading ? "Uploading…" : "Upload"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setUrlMode((v) => !v)}>
          <Link2 />
          Add by URL
        </Button>
      </div>

      {urlMode && (
        <div className="flex gap-2">
          <Input
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
            placeholder="https://…/image.jpg"
            className="h-8"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addByUrl();
              }
            }}
          />
          <Button type="button" size="sm" onClick={addByUrl}>
            Add
          </Button>
        </div>
      )}
    </div>
  );
}
