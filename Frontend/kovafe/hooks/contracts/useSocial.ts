"use client";

import { useCallback } from "react";
import { parseEventLogs } from "viem";
import KALIESO_PROFILES_ABI from "@/lib/abis/kaliesoProfiles.abi";
import KALIESO_FOLLOW_ABI from "@/lib/abis/kaliesoFollow.abi";
import KALIESO_POSTS_ABI from "@/lib/abis/kaliesoPosts.abi";
import { CONTRACTS } from "@/lib/contracts";
import { TokenType } from "@/hooks/contracts/useFactory";
import { useContractWrite } from "@/hooks/contracts/useContractWrite";

export function useSocial() {
  const contractWrite = useContractWrite();

  const createProfile = useCallback(
    async (
      username: string,
      bio: string,
      avatarURI: string,
      websiteURL: string,
    ) =>
      contractWrite.writeAndWait({
        address: CONTRACTS.KALIESO_PROFILES,
        abi: KALIESO_PROFILES_ABI,
        functionName: "createProfile",
        args: [username, bio, avatarURI, websiteURL],
      }),
    [contractWrite],
  );

  const updateProfile = useCallback(
    async (username: string, bio: string, websiteURL: string) =>
      contractWrite.writeAndWait({
        address: CONTRACTS.KALIESO_PROFILES,
        abi: KALIESO_PROFILES_ABI,
        functionName: "updateProfile",
        args: [username, bio, websiteURL],
      }),
    [contractWrite],
  );

  const updateAvatar = useCallback(
    async (avatarURI: string) =>
      contractWrite.writeAndWait({
        address: CONTRACTS.KALIESO_PROFILES,
        abi: KALIESO_PROFILES_ABI,
        functionName: "updateAvatar",
        args: [avatarURI],
      }),
    [contractWrite],
  );

  const follow = useCallback(
    async (wallet: `0x${string}`) =>
      contractWrite.writeAndWait({
        address: CONTRACTS.KALIESO_FOLLOW,
        abi: KALIESO_FOLLOW_ABI,
        functionName: "follow",
        args: [wallet],
      }),
    [contractWrite],
  );

  const unfollow = useCallback(
    async (wallet: `0x${string}`) =>
      contractWrite.writeAndWait({
        address: CONTRACTS.KALIESO_FOLLOW,
        abi: KALIESO_FOLLOW_ABI,
        functionName: "unfollow",
        args: [wallet],
      }),
    [contractWrite],
  );

  const createPost = useCallback(
    async (
      nftContract: `0x${string}`,
      tokenType: TokenType,
      editionTokenId: bigint,
      title: string,
      description: string,
      contentURI: string,
      mediaType: string,
    ) => {
      const receipt = await contractWrite.writeAndWaitForReceipt({
        address: CONTRACTS.KALIESO_POSTS,
        abi: KALIESO_POSTS_ABI,
        functionName: "createPost",
        args: [
          nftContract,
          tokenType,
          editionTokenId,
          title,
          description,
          contentURI,
          mediaType,
        ],
      });

      const [log] = parseEventLogs({
        abi: KALIESO_POSTS_ABI,
        eventName: "PostCreated",
        logs: receipt.logs,
      });

      if (!log?.args?.postId) {
        throw new Error("PostCreated event not found");
      }

      return Number(log.args.postId);
    },
    [contractWrite],
  );

  const likePost = useCallback(
    async (postId: bigint) =>
      contractWrite.writeAndWait({
        address: CONTRACTS.KALIESO_POSTS,
        abi: KALIESO_POSTS_ABI,
        functionName: "likePost",
        args: [postId],
      }),
    [contractWrite],
  );

  const unlikePost = useCallback(
    async (postId: bigint) =>
      contractWrite.writeAndWait({
        address: CONTRACTS.KALIESO_POSTS,
        abi: KALIESO_POSTS_ABI,
        functionName: "unlikePost",
        args: [postId],
      }),
    [contractWrite],
  );

  const addComment = useCallback(
    async (postId: bigint, content: string) =>
      contractWrite.writeAndWait({
        address: CONTRACTS.KALIESO_POSTS,
        abi: KALIESO_POSTS_ABI,
        functionName: "addComment",
        args: [postId, content],
      }),
    [contractWrite],
  );

  return {
    ...contractWrite,
    createProfile,
    updateProfile,
    updateAvatar,
    follow,
    unfollow,
    createPost,
    likePost,
    unlikePost,
    addComment,
  };
}
