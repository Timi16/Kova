'use client';

import { Copy, Check } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { truncateAddress } from "@/lib/format";

export function AddressChip({ address, linkToProfile }: { address: string; linkToProfile?: boolean }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };

  const content = (
    <span className="inline-flex items-center gap-1 font-mono text-sm text-muted-foreground">
      {truncateAddress(address)}
      <button onClick={handleCopy} className="hover:text-foreground transition-default">
        {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
      </button>
    </span>
  );

  if (linkToProfile) {
    return <Link href={`/profile/${address}`} className="hover:text-foreground transition-default">{content}</Link>;
  }
  return content;
}
