export type RefreshLevel = 'light' | 'full';
export type MakeoverStatus = 'generating' | 'done' | 'failed';

export type StyleOption = {
  slug: string;
  name: string;
  tagline: string;
  swatches: string[];
};

export type Room = {
  id: string;
  title: string;
  originalPath: string;
  createdAt: string;
};

export type PaletteColor = {
  hex: string;
  name: string;
  role: string;
};

export type MakeoverTips = {
  keep: string[];
  changeFirst: string[];
};

export type Makeover = {
  id: string;
  roomId: string;
  style: string;
  refreshLevel: RefreshLevel;
  status: MakeoverStatus;
  error: string | null;
  imagePath: string | null;
  palette: PaletteColor[];
  tips: MakeoverTips;
  isSaved: boolean;
  createdAt: string;
};
