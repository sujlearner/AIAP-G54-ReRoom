import { supabase } from '@/lib/supabase';
import { asStringArray } from '@/lib/parse';
import type { StyleOption } from '@/lib/types';

type StyleRaw = {
  slug: string;
  name: string;
  tagline: string;
  swatches: unknown;
};

export async function fetchStyles(): Promise<StyleOption[]> {
  const { data, error } = await supabase
    .from('styles')
    .select('slug, name, tagline, swatches, sort_order')
    .order('sort_order', { ascending: true });
  if (error) throw new Error(error.message);

  return ((data ?? []) as StyleRaw[]).map((row) => ({
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    swatches: asStringArray(row.swatches),
  }));
}
