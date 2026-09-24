export type ListingPurpose = "sale" | "rent";
export type PropertyType = "شقة" | "فيلا" | "شاليه" | "تاون هاوس";

export interface Property {
  id: string;
  slug: string;
  title: string;
  location: string;
  city: string;
  type: PropertyType;
  purpose: ListingPurpose;
  price: number;
  oldPrice?: number;
  installment?: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  imagePosition: string;
  badge: string;
  badgeTone: "green" | "blue" | "pink";
  verified: boolean;
  featured: boolean;
  description: string;
  amenities: string[];
}
