import { store } from "./store";
import { Profile, Property, Photo } from "./validation";
export function photoUrl(path: string) {
  return `/api/media?path=${encodeURIComponent(path)}`;
}
export function hydrate<T extends { images: Photo[] }>(item: T) {
  return {
    ...item,
    images: item.images
      .sort((a, b) => a.position - b.position)
      .map((i) => ({ ...i, url: photoUrl(i.path) })),
  };
}
export async function publicProfile(slug: string): Promise<Profile | null> {
  return store().profileBySlug(slug);
}
export async function publicProperties(owner: string): Promise<Property[]> {
  return (await store().properties(owner, true)).map(hydrate);
}
