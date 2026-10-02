const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/+$/, "");

export function publicPath(path: string): string {
  return path.startsWith("/") ? `${basePath}${path}` : path;
}
