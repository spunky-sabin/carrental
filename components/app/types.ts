export type UserProfile = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  profileImage: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BrandItem = {
  id: string;
  name: string;
  mark: string;
  accent: string;
};

export type CarListing = {
  id: string;
  name: string;
  rating: number;
  location: string;
  seats: number;
  pricePerDay: number;
  accent: string;
  distance?: string;
  favorite?: boolean;
};
