// URL slug generation. Keeps ASCII letters/digits, collapses the rest to "-".
// Falls back to a short random suffix so empty/non-latin titles still produce a slug.

export function slugify(input: string): string {
  const base = input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return base || `item-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Make a slug unique given an async existence check. Appends -2, -3, … until free.
 */
export async function uniqueSlug(
  input: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const base = slugify(input);
  let candidate = base;
  let n = 1;
  while (await exists(candidate)) {
    n += 1;
    candidate = `${base}-${n}`;
  }
  return candidate;
}
