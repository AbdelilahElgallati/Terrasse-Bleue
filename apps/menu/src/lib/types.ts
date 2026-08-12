export type OptionValue = { id: string; label: string; priceDelta: string | number };
export type ProductOption = { id: string; name: string; values: OptionValue[] };
export type Category = { id: string; name: string; description?: string; imageUrl?: string; sortOrder: number };
export type Product = { id: string; categoryId: string; name: string; description: string; price: string | number; imageUrl?: string; isAvailable: boolean; isFeatured: boolean; options: ProductOption[] };
