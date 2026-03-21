import { create } from "zustand";

interface AppState {
  isSignedIn: boolean;
  walletAddress: string | null;
  injBalance: number;
  signIn: () => void;
  signOut: () => void;
  feedTab: "foryou" | "following";
  setFeedTab: (tab: "foryou" | "following") => void;
  followedCreators: Set<string>;
  toggleFollow: (creatorId: string) => void;
  likedPosts: Set<string>;
  toggleLike: (postId: string) => void;
}

export const useStore = create<AppState>((set) => ({
  isSignedIn: false,
  walletAddress: null,
  injBalance: 0,
  signIn: () =>
    set({
      isSignedIn: true,
      walletAddress: "0x7a3b8c9d1e2f4a5b6c7d8e9f0a1b2c3d4e5f6a7b",
      injBalance: 42.069,
    }),
  signOut: () =>
    set({ isSignedIn: false, walletAddress: null, injBalance: 0 }),
  feedTab: "foryou",
  setFeedTab: (tab) => set({ feedTab: tab }),
  followedCreators: new Set(["c1", "c2", "c5"]),
  toggleFollow: (id) =>
    set((s) => {
      const next = new Set(s.followedCreators);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return { followedCreators: next };
    }),
  likedPosts: new Set<string>(),
  toggleLike: (id) =>
    set((s) => {
      const next = new Set(s.likedPosts);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return { likedPosts: next };
    }),
}));
