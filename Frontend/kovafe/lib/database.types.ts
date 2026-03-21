export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          wallet: string;
          username: string;
          bio: string | null;
          avatar_uri: string | null;
          website_url: string | null;
          created_at: string;
        };
        Insert: {
          wallet: string;
          username: string;
          bio?: string | null;
          avatar_uri?: string | null;
          website_url?: string | null;
          created_at?: string;
        };
        Update: {
          wallet?: string;
          username?: string;
          bio?: string | null;
          avatar_uri?: string | null;
          website_url?: string | null;
          created_at?: string;
        };
      };
      follows: {
        Row: {
          follower: string;
          following: string;
          created_at: string;
        };
        Insert: {
          follower: string;
          following: string;
          created_at?: string;
        };
        Update: {
          follower?: string;
          following?: string;
          created_at?: string;
        };
      };
      collections: {
        Row: {
          address: string;
          creator: string;
          name: string;
          token_type: "ERC721" | "ERC1155";
          minter_type: "FixedPrice" | "Free" | "Timed" | "Allowlist" | null;
          minter_address: string | null;
          mint_price: string | null;
          total_minted: number;
          max_supply: number | null;
          wallet_limit: number | null;
          total_volume: string | null;
          metadata_uri: string | null;
          deployed_at: string;
          tx_hash: string | null;
        };
        Insert: {
          address: string;
          creator: string;
          name: string;
          token_type: "ERC721" | "ERC1155";
          minter_type?: "FixedPrice" | "Free" | "Timed" | "Allowlist" | null;
          minter_address?: string | null;
          mint_price?: string | null;
          total_minted?: number;
          max_supply?: number | null;
          wallet_limit?: number | null;
          total_volume?: string | null;
          metadata_uri?: string | null;
          deployed_at?: string;
          tx_hash?: string | null;
        };
        Update: {
          address?: string;
          creator?: string;
          name?: string;
          token_type?: "ERC721" | "ERC1155";
          minter_type?: "FixedPrice" | "Free" | "Timed" | "Allowlist" | null;
          minter_address?: string | null;
          mint_price?: string | null;
          total_minted?: number;
          max_supply?: number | null;
          wallet_limit?: number | null;
          total_volume?: string | null;
          metadata_uri?: string | null;
          deployed_at?: string;
          tx_hash?: string | null;
        };
      };
      posts: {
        Row: {
          post_id: number;
          creator: string;
          nft_contract: string;
          token_type: "ERC721" | "ERC1155";
          edition_token_id: number | null;
          title: string;
          description: string | null;
          content_uri: string | null;
          media_type: string | null;
          like_count: number;
          comment_count: number;
          deleted: boolean;
          created_at: string;
          tx_hash: string | null;
        };
        Insert: {
          post_id: number;
          creator: string;
          nft_contract: string;
          token_type: "ERC721" | "ERC1155";
          edition_token_id?: number | null;
          title: string;
          description?: string | null;
          content_uri?: string | null;
          media_type?: string | null;
          like_count?: number;
          comment_count?: number;
          deleted?: boolean;
          created_at?: string;
          tx_hash?: string | null;
        };
        Update: {
          post_id?: number;
          creator?: string;
          nft_contract?: string;
          token_type?: "ERC721" | "ERC1155";
          edition_token_id?: number | null;
          title?: string;
          description?: string | null;
          content_uri?: string | null;
          media_type?: string | null;
          like_count?: number;
          comment_count?: number;
          deleted?: boolean;
          created_at?: string;
          tx_hash?: string | null;
        };
      };
      comments: {
        Row: {
          comment_id: number;
          post_id: number;
          commenter: string;
          content: string;
          deleted: boolean;
          created_at: string;
        };
        Insert: {
          comment_id: number;
          post_id: number;
          commenter: string;
          content: string;
          deleted?: boolean;
          created_at?: string;
        };
        Update: {
          comment_id?: number;
          post_id?: number;
          commenter?: string;
          content?: string;
          deleted?: boolean;
          created_at?: string;
        };
      };
      likes: {
        Row: {
          post_id: number;
          wallet: string;
          created_at: string;
        };
        Insert: {
          post_id: number;
          wallet: string;
          created_at?: string;
        };
        Update: {
          post_id?: number;
          wallet?: string;
          created_at?: string;
        };
      };
      mints: {
        Row: {
          collection: string;
          token_id: number;
          minter: string;
          quantity: number;
          price_paid: string;
          tx_hash: string | null;
          created_at: string;
        };
        Insert: {
          collection: string;
          token_id: number;
          minter: string;
          quantity: number;
          price_paid: string;
          tx_hash?: string | null;
          created_at?: string;
        };
        Update: {
          collection?: string;
          token_id?: number;
          minter?: string;
          quantity?: number;
          price_paid?: string;
          tx_hash?: string | null;
          created_at?: string;
        };
      };
      listings: {
        Row: {
          listing_id: number;
          contract: string;
          token_id: number;
          seller: string;
          price: string;
          token_type: "ERC721" | "ERC1155";
          quantity: number;
          status: "active" | "sold" | "cancelled";
          tx_hash: string | null;
          created_at: string;
        };
        Insert: {
          listing_id: number;
          contract: string;
          token_id: number;
          seller: string;
          price: string;
          token_type: "ERC721" | "ERC1155";
          quantity?: number;
          status?: "active" | "sold" | "cancelled";
          tx_hash?: string | null;
          created_at?: string;
        };
        Update: {
          listing_id?: number;
          contract?: string;
          token_id?: number;
          seller?: string;
          price?: string;
          token_type?: "ERC721" | "ERC1155";
          quantity?: number;
          status?: "active" | "sold" | "cancelled";
          tx_hash?: string | null;
          created_at?: string;
        };
      };
      offers: {
        Row: {
          offer_id: number;
          contract: string;
          token_id: number;
          buyer: string;
          amount: string;
          token_type: "ERC721" | "ERC1155";
          quantity: number;
          status: "active" | "accepted" | "cancelled" | "expired";
          expires_at: string | null;
          tx_hash: string | null;
          created_at: string;
        };
        Insert: {
          offer_id: number;
          contract: string;
          token_id: number;
          buyer: string;
          amount: string;
          token_type: "ERC721" | "ERC1155";
          quantity?: number;
          status?: "active" | "accepted" | "cancelled" | "expired";
          expires_at?: string | null;
          tx_hash?: string | null;
          created_at?: string;
        };
        Update: {
          offer_id?: number;
          contract?: string;
          token_id?: number;
          buyer?: string;
          amount?: string;
          token_type?: "ERC721" | "ERC1155";
          quantity?: number;
          status?: "active" | "accepted" | "cancelled" | "expired";
          expires_at?: string | null;
          tx_hash?: string | null;
          created_at?: string;
        };
      };
      activity: {
        Row: {
          id: string;
          event_type:
            | "deploy"
            | "mint"
            | "list"
            | "sale"
            | "offer_made"
            | "offer_accepted"
            | "offer_cancelled"
            | "follow"
            | "post"
            | "comment"
            | "like";
          actor: string;
          target: string | null;
          contract: string | null;
          post_id: number | null;
          token_id: number | null;
          listing_id: number | null;
          offer_id: number | null;
          amount: string | null;
          tx_hash: string | null;
          created_at: string;
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          event_type:
            | "deploy"
            | "mint"
            | "list"
            | "sale"
            | "offer_made"
            | "offer_accepted"
            | "offer_cancelled"
            | "follow"
            | "post"
            | "comment"
            | "like";
          actor: string;
          target?: string | null;
          contract?: string | null;
          post_id?: number | null;
          token_id?: number | null;
          listing_id?: number | null;
          offer_id?: number | null;
          amount?: string | null;
          tx_hash?: string | null;
          created_at?: string;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          event_type?:
            | "deploy"
            | "mint"
            | "list"
            | "sale"
            | "offer_made"
            | "offer_accepted"
            | "offer_cancelled"
            | "follow"
            | "post"
            | "comment"
            | "like";
          actor?: string;
          target?: string | null;
          contract?: string | null;
          post_id?: number | null;
          token_id?: number | null;
          listing_id?: number | null;
          offer_id?: number | null;
          amount?: string | null;
          tx_hash?: string | null;
          created_at?: string;
          metadata?: Json | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
