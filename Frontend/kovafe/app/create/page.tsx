'use client';

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Image, Video, FileText, X, Check, Upload } from "lucide-react";
import { useStore } from "@/store/useStore";

const steps = ["Type", "Content", "Pricing", "Royalties", "Review"];

export default function CreatePage() {
  const { isSignedIn, signIn, walletAddress } = useStore();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [dropType, setDropType] = useState<"limited" | "open" | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [minterType, setMinterType] = useState<string>("fixed");
  const [price, setPrice] = useState("0.042");
  const [supply, setSupply] = useState("100");
  const [unlimited, setUnlimited] = useState(false);
  const [walletLimit, setWalletLimit] = useState("5");
  const [noLimit, setNoLimit] = useState(false);
  const [royalty, setRoyalty] = useState(5);
  const [deploying, setDeploying] = useState(false);
  const [deployed, setDeployed] = useState(false);

  if (!isSignedIn) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Create a Drop</h2>
        <p className="text-muted-foreground mb-6">Sign in to deploy your content onchain</p>
        <button onClick={signIn} className="px-6 py-3 bg-primary text-primary-foreground rounded-full font-semibold hover:opacity-90 transition-default">
          Sign In
        </button>
      </div>
    );
  }

  const canNext =
    (step === 0 && dropType !== null) ||
    (step === 1 && title.trim() !== "") ||
    step === 2 ||
    step === 3 ||
    step === 4;

  const handleDeploy = () => {
    setDeploying(true);
    setTimeout(() => {
      setDeploying(false);
      setDeployed(true);
    }, 2500);
  };

  return (
    <div className="max-w-[1100px] mx-auto px-4 lg:px-6 py-6">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <button
              onClick={() => i < step && setStep(i)}
              className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center transition-default ${
                i === step ? "bg-primary text-primary-foreground" :
                i < step ? "bg-primary/20 text-primary" :
                "bg-surface text-muted-foreground"
              }`}
            >
              {i < step ? <Check className="w-4 h-4" /> : i + 1}
            </button>
            {i < steps.length - 1 && <div className={`w-8 h-px ${i < step ? "bg-primary" : "bg-border"}`} />}
          </div>
        ))}
      </div>

      <div className="flex gap-8">
        {/* Live Preview */}
        <div className="hidden lg:block w-[400px] flex-shrink-0">
          <div className="sticky top-[76px]">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Live Preview</p>
            <div className="card-surface overflow-hidden">
              <div className="p-4 pb-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-400" />
                <div>
                  <p className="text-sm font-semibold text-foreground">You</p>
                  <p className="text-xs font-mono text-muted-foreground">Just now</p>
                </div>
              </div>
              <div className="aspect-square bg-surface-elevated flex items-center justify-center">
                {mediaPreview ? (
                  <img src={mediaPreview} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Image className="w-12 h-12 text-muted-foreground" />
                )}
              </div>
              <div className="p-4 space-y-2">
                <p className="text-base font-bold text-foreground">{title || "Your title here"}</p>
                {description && <p className="text-sm text-muted-foreground">{description}</p>}
                <div className="flex items-center justify-between pt-2">
                  <span className="font-mono text-sm text-foreground">
                    {minterType === "free" ? "FREE + gas" : `${price} INJ`}
                  </span>
                  <span className="px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold">MINT →</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 max-w-[500px]">
          {deployed ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Live on Kalieso!</h2>
              <p className="text-muted-foreground mb-6">Your drop has been deployed to Injective</p>
              <button onClick={() => router.push("/")} className="px-6 py-3 bg-primary text-primary-foreground rounded-full font-semibold hover:opacity-90 transition-default">
                View Post
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-foreground mb-6">{steps[step]}</h2>

              {step === 0 && (
                <div className="grid grid-cols-2 gap-4">
                  {([["limited", "◈ Limited Drop", "ERC-721", "Fixed supply, numbered tokens"], ["open", "⊕ Open Edition", "ERC-1155", "Unlimited or timed window"]] as const).map(([type, label, standard, desc]) => (
                    <button
                      key={type}
                      onClick={() => setDropType(type)}
                      className={`card-surface p-5 text-left relative transition-default ${
                        dropType === type ? "border-primary" : "hover:border-muted-foreground/30"
                      }`}
                    >
                      {dropType === type && <Check className="absolute top-3 right-3 w-5 h-5 text-primary" />}
                      <p className="text-lg font-bold text-foreground mb-2">{label}</p>
                      <p className="text-xs text-muted-foreground font-mono mb-1">{standard}</p>
                      <p className="text-sm text-muted-foreground">{desc}</p>
                    </button>
                  ))}
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <div
                    onClick={() => setMediaPreview("https://picsum.photos/seed/upload/600/600")}
                    className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-muted-foreground transition-default"
                  >
                    {mediaPreview ? (
                      <div className="relative w-full">
                        <img src={mediaPreview} alt="" className="w-full aspect-square object-cover rounded-lg" />
                        <button onClick={(e) => { e.stopPropagation(); setMediaPreview(null); }} className="absolute top-2 right-2 w-8 h-8 bg-background/80 rounded-full flex items-center justify-center">
                          <X className="w-4 h-4 text-foreground" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex gap-3 mb-3 text-muted-foreground">
                          <Image className="w-6 h-6" />
                          <Video className="w-6 h-6" />
                          <FileText className="w-6 h-6" />
                        </div>
                        <p className="text-sm text-foreground font-medium mb-1">Drop your media here or click to upload</p>
                        <p className="text-xs text-muted-foreground">JPG, PNG, GIF, MP4, WebM · Max 50MB</p>
                      </>
                    )}
                  </div>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Title (required)"
                    className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary text-sm"
                  />
                  <div className="relative">
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value.slice(0, 280))}
                      placeholder="Description (optional)"
                      rows={3}
                      className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary text-sm resize-none"
                    />
                    <span className="absolute bottom-3 right-3 text-xs text-muted-foreground">{description.length}/280</span>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-3">
                    {["fixed", "free", "timed", "allowlist"].map((t) => (
                      <button
                        key={t}
                        onClick={() => setMinterType(t)}
                        className={`card-surface p-4 text-left transition-default capitalize ${
                          minterType === t ? "border-primary" : "hover:border-muted-foreground/30"
                        }`}
                      >
                        <p className="text-sm font-semibold text-foreground">{t === "fixed" ? "Fixed Price" : t === "free" ? "Free Mint" : t === "timed" ? "Timed Edition" : "Allowlist"}</p>
                      </button>
                    ))}
                  </div>
                  {minterType !== "free" && (
                    <div>
                      <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-2">Price</label>
                      <div className="flex items-center gap-2">
                        <input
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          className="flex-1 px-4 py-3 bg-surface border border-border rounded-lg text-foreground font-mono focus:outline-none focus:border-primary text-sm"
                        />
                        <span className="text-sm font-mono text-muted-foreground">INJ</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 font-mono">~${(parseFloat(price || "0") * 22.5).toFixed(2)}</p>
                    </div>
                  )}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs text-muted-foreground uppercase tracking-wider">Supply</label>
                      <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                        <input type="checkbox" checked={unlimited} onChange={() => setUnlimited(!unlimited)} className="accent-primary" />
                        Unlimited
                      </label>
                    </div>
                    {!unlimited && (
                      <input value={supply} onChange={(e) => setSupply(e.target.value)} className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-foreground font-mono focus:outline-none focus:border-primary text-sm" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs text-muted-foreground uppercase tracking-wider">Wallet Limit</label>
                      <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                        <input type="checkbox" checked={noLimit} onChange={() => setNoLimit(!noLimit)} className="accent-primary" />
                        No limit
                      </label>
                    </div>
                    {!noLimit && (
                      <input value={walletLimit} onChange={(e) => setWalletLimit(e.target.value)} className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-foreground font-mono focus:outline-none focus:border-primary text-sm" />
                    )}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-3">Royalty: {royalty}% ({royalty * 100} bps)</label>
                    <input
                      type="range"
                      min={0}
                      max={10}
                      step={0.5}
                      value={royalty}
                      onChange={(e) => setRoyalty(parseFloat(e.target.value))}
                      className="w-full accent-primary"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>0%</span><span>10%</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-2">Receiver Address</label>
                    <input
                      defaultValue={walletAddress || ""}
                      className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-foreground font-mono text-sm focus:outline-none focus:border-primary"
                    />
                    <button className="text-xs text-primary mt-1.5 hover:underline">Use my wallet</button>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6">
                  <div className="card-surface p-5 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Title</span>
                      <span className="text-foreground font-medium">{title || "Untitled"}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Type</span>
                      <span className="text-foreground font-medium">{dropType === "open" ? "Open Edition" : "Limited Drop"}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Minter</span>
                      <span className="text-foreground font-medium capitalize">{minterType === "fixed" ? "Fixed Price" : minterType}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Price</span>
                      <span className="text-foreground font-mono">{minterType === "free" ? "FREE" : `${price} INJ`}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Supply</span>
                      <span className="text-foreground font-mono">{unlimited ? "Unlimited" : supply}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Royalty</span>
                      <span className="text-foreground font-mono">{royalty}%</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Estimated gas: ~0.002 INJ</p>
                  <button
                    onClick={handleDeploy}
                    disabled={deploying}
                    className="w-full py-3.5 bg-primary text-primary-foreground rounded-full font-bold text-base hover:opacity-90 transition-default disabled:opacity-50"
                  >
                    {deploying ? (
                      <span className="flex items-center justify-center gap-2">
                        <Upload className="w-4 h-4 animate-spin" />
                        Deploying...
                      </span>
                    ) : "Deploy to Injective"}
                  </button>
                </div>
              )}

              {!deployed && step < 4 && (
                <div className="flex justify-between mt-8">
                  <button
                    onClick={() => setStep(Math.max(0, step - 1))}
                    disabled={step === 0}
                    className="px-5 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-30 transition-default"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep(step + 1)}
                    disabled={!canNext}
                    className="px-6 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-semibold hover:opacity-90 disabled:opacity-30 transition-default"
                  >
                    Continue
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
