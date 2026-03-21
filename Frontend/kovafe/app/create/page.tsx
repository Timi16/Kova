'use client';

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Image, Loader2, Upload, Video, X } from "lucide-react";
import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";
import { parseEther } from "viem";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { useAuth } from "@/hooks/useAuth";
import { useFactory, MinterType, TokenType } from "@/hooks/contracts/useFactory";
import { useSocial } from "@/hooks/contracts/useSocial";
import { useINJPrice } from "@/hooks/data/useINJPrice";

const steps = ["Type", "Content", "Pricing", "Royalties", "Review"];

type DropType = "limited" | "open";
type MintCard = "fixed" | "free" | "timed" | "allowlist";

type UploadResult = {
  cid: string;
  url: string;
};

function uploadFileWithProgress(file: File, onProgress: (progress: number) => void) {
  return new Promise<UploadResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");
    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });
    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error("Upload failed"));
        return;
      }

      resolve(JSON.parse(xhr.responseText) as UploadResult);
    };
    xhr.onerror = () => reject(new Error("Upload failed"));

    const formData = new FormData();
    formData.append("file", file);
    xhr.send(formData);
  });
}

export default function CreatePage() {
  const router = useRouter();
  const { address } = useAuth();
  const factory = useFactory();
  const social = useSocial();
  const injPrice = useINJPrice();

  const [step, setStep] = useState(0);
  const [dropType, setDropType] = useState<DropType>("limited");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [contentCID, setContentCID] = useState("");
  const [minterType, setMinterType] = useState<MintCard>("fixed");
  const [price, setPrice] = useState("0.042");
  const [supply, setSupply] = useState("100");
  const [unlimited, setUnlimited] = useState(false);
  const [walletLimit, setWalletLimit] = useState("5");
  const [noLimit, setNoLimit] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [allowlistAddresses, setAllowlistAddresses] = useState("");
  const [royalty, setRoyalty] = useState(5);
  const [receiverAddress, setReceiverAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (address && !receiverAddress) {
      setReceiverAddress(address);
    }
  }, [address, receiverAddress]);

  const merkleRoot = useMemo(() => {
    const addresses = allowlistAddresses
      .split("\n")
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean);

    if (!addresses.length) return "0x0000000000000000000000000000000000000000000000000000000000000000";

    const leaves = addresses.map((entry) => keccak256(entry));
    const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    return tree.getHexRoot() as `0x${string}`;
  }, [allowlistAddresses]);

  const mintPriceDisplay =
    minterType === "free" ? "FREE + gas" : `${Number(price || 0).toFixed(4)} INJ`;

  const usdEstimate =
    minterType === "free"
      ? 0
      : Number(price || 0) * (injPrice.data?.usd ?? 0);

  async function handleFileSelect(file: File) {
    setSelectedFile(file);
    setMediaPreview(URL.createObjectURL(file));
    setUploading(true);
    setUploadProgress(0);

    try {
      const uploaded = await uploadFileWithProgress(file, setUploadProgress);
      setContentCID(uploaded.cid);
    } finally {
      setUploading(false);
    }
  }

  async function handleDeploy() {
    if (!address) return;
    if (!title.trim() || !contentCID) {
      throw new Error("Title and uploaded media are required");
    }

    if (minterType === "allowlist" && merkleRoot.endsWith("0000000000000000000000000000000000000000000000000000000000000000")) {
      throw new Error("Add at least one allowlist address");
    }

    setSubmitting(true);

    try {
      const metadata = await fetch("/api/upload/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: title,
          description,
          image: `ipfs://${contentCID}`,
          external_url: "https://kalieso.xyz",
        }),
      }).then(async (response) => {
        if (!response.ok) {
          const error = await response.json().catch(() => null);
          throw new Error(error?.error ?? "Metadata upload failed");
        }
        return response.json() as Promise<UploadResult>;
      });

      const maxSupply = BigInt(unlimited ? 0 : Number(supply || 0));
      const mintStart = BigInt(startTime ? Math.floor(new Date(startTime).getTime() / 1000) : 0);
      const mintEnd = BigInt(endTime ? Math.floor(new Date(endTime).getTime() / 1000) : 0);
      const perWallet = BigInt(noLimit ? 0 : Number(walletLimit || 0));
      const parsedPrice = parseEther(minterType === "free" ? "0" : price || "0");

      const minterData = factory.encodeMinterData(
        minterType === "free"
          ? MinterType.Free
          : minterType === "timed"
            ? MinterType.Timed
            : minterType === "allowlist"
              ? MinterType.Allowlist
              : MinterType.FixedPrice,
        minterType === "free"
          ? { walletLimit: perWallet }
          : minterType === "timed"
            ? {
                price: parsedPrice,
                startTime: mintStart,
                endTime: mintEnd,
                maxPerWallet: perWallet,
              }
            : minterType === "allowlist"
              ? {
                  price: parsedPrice,
                  merkleRoot,
                  maxPerWallet: perWallet,
                }
              : {
                  price: parsedPrice,
                  maxPerWallet: perWallet,
                },
      );

      const collectionAddress =
        dropType === "limited"
          ? await factory.deployNFTDrop(
              {
                name: title,
                symbol: title.slice(0, 4).toUpperCase() || "KALI",
                baseURI: `ipfs://${metadata.cid}`,
                hiddenURI: "",
                maxSupply,
                mintPrice: parsedPrice,
                mintStart,
                mintEnd,
                walletLimit: perWallet,
                royaltyBps: Math.round(royalty * 100),
                royaltyReceiver: receiverAddress as `0x${string}`,
                isRevealed: true,
              },
              minterType === "free"
                ? MinterType.Free
                : minterType === "timed"
                  ? MinterType.Timed
                  : minterType === "allowlist"
                    ? MinterType.Allowlist
                    : MinterType.FixedPrice,
              minterData,
            )
          : await factory.deployEdition(
              title,
              {
                name: title,
                uri: `ipfs://${metadata.cid}`,
                tokenId: 1n,
                maxSupply,
                mintPrice: parsedPrice,
                mintStart,
                mintEnd,
                walletLimit: perWallet,
                royaltyBps: Math.round(royalty * 100),
                royaltyReceiver: receiverAddress as `0x${string}`,
              },
              minterType === "free"
                ? MinterType.Free
                : minterType === "timed"
                  ? MinterType.Timed
                  : minterType === "allowlist"
                    ? MinterType.Allowlist
                    : MinterType.FixedPrice,
              minterData,
            );

      const postId = await social.createPost(
        collectionAddress,
        dropType === "limited" ? TokenType.ERC721 : TokenType.ERC1155,
        dropType === "limited" ? 0n : 1n,
        title,
        description,
        `ipfs://${contentCID}`,
        selectedFile?.type.startsWith("video") ? "video" : "image",
      );

      router.push(`/post/${postId}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <RequireAuth requireProfile>
      <div className="mx-auto max-w-[1100px] px-4 py-6 lg:px-6">
        <div className="mb-8 flex items-center justify-center gap-2">
          {steps.map((label, index) => (
            <div key={label} className="flex items-center gap-2">
              <button
                onClick={() => index < step && setStep(index)}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-default ${
                  index === step
                    ? "bg-primary text-primary-foreground"
                    : index < step
                      ? "bg-primary/20 text-primary"
                      : "bg-surface text-muted-foreground"
                }`}
              >
                {index < step ? <Check className="h-4 w-4" /> : index + 1}
              </button>
              {index < steps.length - 1 ? (
                <div className={`h-px w-8 ${index < step ? "bg-primary" : "bg-border"}`} />
              ) : null}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="hidden w-[400px] flex-shrink-0 lg:block">
            <div className="sticky top-[76px]">
              <p className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">
                Live Preview
              </p>
              <div className="card-surface overflow-hidden">
                <div className="flex items-center gap-3 p-4 pb-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-purple-400" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">You</p>
                    <p className="text-xs font-mono text-muted-foreground">Ready to publish</p>
                  </div>
                </div>
                <div className="aspect-square bg-surface-elevated">
                  {mediaPreview ? (
                    selectedFile?.type.startsWith("video") ? (
                      <video src={mediaPreview} className="h-full w-full object-cover" controls />
                    ) : (
                      <img src={mediaPreview} alt="" className="h-full w-full object-cover" />
                    )
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Image className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="space-y-2 p-4">
                  <p className="text-base font-bold text-foreground">
                    {title || "Your title here"}
                  </p>
                  {description ? (
                    <p className="text-sm text-muted-foreground">{description}</p>
                  ) : null}
                  <div className="flex items-center justify-between pt-2">
                    <span className="font-mono text-sm text-foreground">{mintPriceDisplay}</span>
                    <span className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">
                      MINT →
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-[560px] flex-1">
            <h1 className="mb-6 text-2xl font-bold tracking-tight text-foreground">
              Create on Injective
            </h1>

            {step === 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {([
                  ["limited", "◈ Limited Drop", "ERC-721", "Fixed supply, numbered tokens"],
                  ["open", "⊕ Open Edition", "ERC-1155", "Open or timed social edition"],
                ] as const).map(([type, label, standard, desc]) => (
                  <button
                    key={type}
                    onClick={() => setDropType(type)}
                    className={`card-surface relative p-5 text-left transition-default ${
                      dropType === type ? "border-primary" : "hover:border-muted-foreground/30"
                    }`}
                  >
                    {dropType === type ? (
                      <Check className="absolute right-3 top-3 h-5 w-5 text-primary" />
                    ) : null}
                    <p className="mb-2 text-lg font-bold text-foreground">{label}</p>
                    <p className="mb-1 text-xs font-mono text-muted-foreground">{standard}</p>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                  </button>
                ))}
              </div>
            ) : null}

            {step === 1 ? (
              <div className="space-y-4">
                <label className="block cursor-pointer rounded-xl border-2 border-dashed border-border p-8 text-center transition-default hover:border-primary/50">
                  <input
                    type="file"
                    accept="image/*,video/mp4,video/webm"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void handleFileSelect(file);
                    }}
                  />
                  {mediaPreview ? (
                    <div className="relative">
                      {selectedFile?.type.startsWith("video") ? (
                        <video src={mediaPreview} className="aspect-square w-full rounded-lg object-cover" controls />
                      ) : (
                        <img src={mediaPreview} alt="" className="aspect-square w-full rounded-lg object-cover" />
                      )}
                      <button
                        onClick={(event) => {
                          event.preventDefault();
                          setMediaPreview(null);
                          setSelectedFile(null);
                          setContentCID("");
                        }}
                        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-background/80"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="mb-3 flex justify-center gap-3 text-muted-foreground">
                        <Image className="h-6 w-6" />
                        <Video className="h-6 w-6" />
                        <Upload className="h-6 w-6" />
                      </div>
                      <p className="text-sm font-medium text-foreground">
                        Drop your media here or click to upload
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        JPG, PNG, GIF, WEBP, MP4, WebM · Max 50MB
                      </p>
                    </>
                  )}
                </label>

                {uploading ? (
                  <div className="rounded-xl border border-border bg-surface p-4">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-foreground">Uploading to IPFS</span>
                      <span className="font-mono text-muted-foreground">{uploadProgress}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-surface-elevated">
                      <div className="h-full bg-primary" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                ) : null}

                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Title (required)"
                  className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none focus:border-primary"
                />
                <div className="relative">
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value.slice(0, 1000))}
                    placeholder="Description (optional)"
                    rows={4}
                    className="w-full resize-none rounded-lg border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none focus:border-primary"
                  />
                  <span className="absolute bottom-3 right-3 text-xs text-muted-foreground">
                    {description.length}/1000
                  </span>
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {(["fixed", "free", "timed", "allowlist"] as const).map((card) => (
                    <button
                      key={card}
                      onClick={() => setMinterType(card)}
                      className={`card-surface p-4 text-left transition-default ${
                        minterType === card ? "border-primary" : "hover:border-muted-foreground/30"
                      }`}
                    >
                      <p className="text-sm font-semibold text-foreground">
                        {card === "fixed"
                          ? "Fixed Price"
                          : card === "free"
                            ? "Free"
                            : card === "timed"
                              ? "Timed"
                              : "Allowlist"}
                      </p>
                    </button>
                  ))}
                </div>

                {minterType !== "free" ? (
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-wider text-muted-foreground">
                      Mint Price
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        value={price}
                        onChange={(event) => setPrice(event.target.value)}
                        className="flex-1 rounded-lg border border-border bg-surface px-4 py-3 font-mono text-sm text-foreground outline-none focus:border-primary"
                      />
                      <span className="text-sm font-mono text-muted-foreground">INJ</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      ~${usdEstimate.toFixed(2)}
                    </p>
                  </div>
                ) : null}

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-xs uppercase tracking-wider text-muted-foreground">
                      Supply Cap
                    </label>
                    <label className="text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={unlimited}
                        onChange={() => setUnlimited((current) => !current)}
                        className="mr-2 accent-primary"
                      />
                      Unlimited
                    </label>
                  </div>
                  {!unlimited ? (
                    <input
                      value={supply}
                      onChange={(event) => setSupply(event.target.value)}
                      className="w-full rounded-lg border border-border bg-surface px-4 py-3 font-mono text-sm text-foreground outline-none focus:border-primary"
                    />
                  ) : null}
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-xs uppercase tracking-wider text-muted-foreground">
                      Wallet Limit
                    </label>
                    <label className="text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={noLimit}
                        onChange={() => setNoLimit((current) => !current)}
                        className="mr-2 accent-primary"
                      />
                      No limit
                    </label>
                  </div>
                  {!noLimit ? (
                    <input
                      value={walletLimit}
                      onChange={(event) => setWalletLimit(event.target.value)}
                      className="w-full rounded-lg border border-border bg-surface px-4 py-3 font-mono text-sm text-foreground outline-none focus:border-primary"
                    />
                  ) : null}
                </div>

                {minterType === "timed" ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input
                      type="datetime-local"
                      value={startTime}
                      onChange={(event) => setStartTime(event.target.value)}
                      className="rounded-lg border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none focus:border-primary"
                    />
                    <input
                      type="datetime-local"
                      value={endTime}
                      onChange={(event) => setEndTime(event.target.value)}
                      className="rounded-lg border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none focus:border-primary"
                    />
                  </div>
                ) : null}

                {minterType === "allowlist" ? (
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-wider text-muted-foreground">
                      Allowlist Addresses
                    </label>
                    <textarea
                      value={allowlistAddresses}
                      onChange={(event) => setAllowlistAddresses(event.target.value)}
                      rows={6}
                      placeholder="One address per line"
                      className="w-full rounded-lg border border-border bg-surface px-4 py-3 font-mono text-sm text-foreground outline-none focus:border-primary"
                    />
                    <p className="mt-2 text-xs text-muted-foreground">
                      Merkle Root: <span className="font-mono">{merkleRoot}</span>
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-6">
                <div>
                  <label className="mb-3 block text-xs uppercase tracking-wider text-muted-foreground">
                    Royalty: {royalty}% ({royalty * 100} bps)
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    step={0.5}
                    value={royalty}
                    onChange={(event) => setRoyalty(Number(event.target.value))}
                    className="w-full accent-primary"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-wider text-muted-foreground">
                    Receiver Address
                  </label>
                  <input
                    value={receiverAddress}
                    onChange={(event) => setReceiverAddress(event.target.value)}
                    className="w-full rounded-lg border border-border bg-surface px-4 py-3 font-mono text-sm text-foreground outline-none focus:border-primary"
                  />
                </div>
              </div>
            ) : null}

            {step === 4 ? (
              <div className="space-y-4">
                <div className="card-surface space-y-3 p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Type</span>
                    <span className="text-sm font-semibold text-foreground">
                      {dropType === "limited" ? "Limited Drop" : "Open Edition"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Mint strategy</span>
                    <span className="text-sm font-semibold capitalize text-foreground">
                      {minterType}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Mint price</span>
                    <span className="font-mono text-sm text-foreground">{mintPriceDisplay}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Supply</span>
                    <span className="font-mono text-sm text-foreground">
                      {unlimited ? "Unlimited" : supply}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Wallet limit</span>
                    <span className="font-mono text-sm text-foreground">
                      {noLimit ? "No limit" : walletLimit}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Estimated gas</span>
                    <span className="text-sm text-foreground">Calculated in wallet</span>
                  </div>
                </div>
                <button
                  onClick={() => void handleDeploy()}
                  disabled={submitting || uploading}
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Deploy to Injective
                </button>
              </div>
            ) : null}

            <div className="mt-8 flex items-center justify-between">
              <button
                onClick={() => setStep((current) => Math.max(0, current - 1))}
                disabled={step === 0}
                className="rounded-full border border-border px-4 py-2 text-sm text-foreground disabled:opacity-40"
              >
                Back
              </button>
              <button
                onClick={() => setStep((current) => Math.min(steps.length - 1, current + 1))}
                disabled={
                  step === steps.length - 1 ||
                  (step === 1 && (!title.trim() || !contentCID)) ||
                  (step === 2 && minterType === "timed" && (!startTime || !endTime))
                }
                className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}
