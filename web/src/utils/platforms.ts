import { Platforms } from "gen/speedupdate_pb";

export type PlatformKey = "win64" | "macos_x86_64" | "macos_arm64" | "linux";
export type RepoType = "game" | "launcher";

export const PLATFORMS: { key: PlatformKey; label: string; enum: Platforms }[] = [
  { key: "win64",         label: "Windows x64", enum: Platforms.WIN64 },
  { key: "macos_x86_64", label: "macOS x86_64", enum: Platforms.MACOS_X86_64 },
  { key: "macos_arm64",  label: "macOS arm64",  enum: Platforms.MACOS_ARM64 },
  { key: "linux",        label: "Linux",        enum: Platforms.LINUX },
];

export const PLATFORM_COLORS: Record<PlatformKey, "default" | "primary" | "secondary" | "warning"> = {
  win64:         "primary",
  macos_x86_64:  "secondary",
  macos_arm64:   "secondary",
  linux:         "warning",
};

/** Platforms enum → PlatformKey string. Throws if unknown. */
export const enumToKey = (platform: Platforms): PlatformKey => {
  const found = PLATFORMS.find((p) => p.enum === platform);
  if (!found) throw new Error(`Unknown platform enum: ${platform}`);
  return found.key;
};

/** PlatformKey string → Platforms enum. Throws if unknown. */
export const keyToEnum = (key: PlatformKey): Platforms => {
  const found = PLATFORMS.find((p) => p.key === key);
  if (!found) throw new Error(`Unknown platform key: ${key}`);
  return found.enum;
};

/** Record<PlatformKey, boolean> (checkbox state) → PlatformKey[] */
export const checkedToKeys = (checked: Record<PlatformKey, boolean>): PlatformKey[] =>
  PLATFORMS.filter((p) => checked[p.key]).map((p) => p.key);

/** Record<PlatformKey, boolean> → Platforms[] */
export const checkedToEnums = (checked: Record<PlatformKey, boolean>): Platforms[] =>
  PLATFORMS.filter((p) => checked[p.key]).map((p) => p.enum);
