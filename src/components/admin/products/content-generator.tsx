"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { generateProductContentAction } from "@/server/actions/ai";
import type { GeneratedProductContent } from "@/server/integrations/ai";

type Language = "en" | "bn" | "both";

// AI-1: "✨ Generate" beside the description. Captures rough/Chinese supplier text,
// calls the AI adapter, and hands clean copy back to the form (human-in-the-loop —
// the admin reviews and edits before saving). See docs/08-ai-features.md.
export function ContentGenerator({
  title,
  category,
  onApply,
}: {
  title: string;
  category?: string;
  onApply: (content: GeneratedProductContent) => void;
}) {
  const [open, setOpen] = useState(false);
  const [sourceText, setSourceText] = useState("");
  const [language, setLanguage] = useState<Language>("en");
  const [loading, setLoading] = useState(false);

  async function onGenerate() {
    if (!title.trim() && !sourceText.trim()) {
      toast.error("Add a product title or paste some source text first");
      return;
    }
    setLoading(true);
    try {
      const res = await generateProductContentAction({
        title: title.trim() || undefined,
        sourceText: sourceText.trim() || undefined,
        category,
        language,
      });
      if (!res.ok) {
        toast.error("Generation failed", res.error.message);
        return;
      }
      onApply(res.data);
      toast.success("Content generated", "Review and edit before saving.");
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="secondary" size="sm">
          <Sparkles />
          Generate
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate product content</DialogTitle>
          <DialogDescription>
            Paste the supplier description (English, Bangla, or Chinese) and let AI draft a clean
            title, description, and specifications. You can edit everything afterwards.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ai-source">Source text (optional)</Label>
            <Textarea
              id="ai-source"
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Paste supplier / Chinese description or rough notes…"
              className="min-h-32"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ai-language">Output language</Label>
            <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
              <SelectTrigger id="ai-language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="bn">Bangla</SelectItem>
                <SelectItem value="both">Bangla + English</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" onClick={onGenerate} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
            Generate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
