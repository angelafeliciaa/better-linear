export function avatarBucket(id: string): 1 | 2 | 3 {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return ((h % 3) + 1) as 1 | 2 | 3;
}

export function avatarInitial(name: string): string {
  const trimmed = name.trim();
  return trimmed.length ? trimmed[0]!.toUpperCase() : "?";
}
