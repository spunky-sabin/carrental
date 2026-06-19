import type { BrandItem, CarListing } from "@/components/app/types";

export const brands: BrandItem[] = [
  { id: "tesla", name: "Tesla", mark: "T", accent: "#f05243" },
  { id: "lamborghini", name: "Lamborghini", mark: "L", accent: "#f4c45f" },
  { id: "bmw", name: "BMW", mark: "B", accent: "#5e9df5" },
  { id: "ferrari", name: "Ferrari", mark: "F", accent: "#f36d58" },
];

export const bestCars: CarListing[] = [
  {
    id: "tesla-model-s",
    name: "Tesla Model S",
    rating: 4.9,
    location: "New York, USA",
    seats: 5,
    pricePerDay: 210,
    accent: "#dfe9ea",
    favorite: true,
  },
  {
    id: "lamborghini-huracan",
    name: "Lamborghini Huracan",
    rating: 4.8,
    location: "Miami, USA",
    seats: 2,
    pricePerDay: 620,
    accent: "#f5df8f",
  },
  {
    id: "bmw-i8",
    name: "BMW i8 Coupe",
    rating: 4.7,
    location: "Austin, USA",
    seats: 4,
    pricePerDay: 310,
    accent: "#d8e6fb",
  },
];

export const nearbyCars: CarListing[] = [
  {
    id: "ferrari-roma",
    name: "Ferrari Roma",
    rating: 4.8,
    location: "2.4 mi away",
    seats: 2,
    pricePerDay: 540,
    accent: "#f7d5ce",
    distance: "2.4 mi",
  },
  {
    id: "tesla-model-y",
    name: "Tesla Model Y",
    rating: 4.6,
    location: "3.1 mi away",
    seats: 5,
    pricePerDay: 185,
    accent: "#dce8df",
    distance: "3.1 mi",
  },
  {
    id: "bmw-x5",
    name: "BMW X5",
    rating: 4.7,
    location: "4.0 mi away",
    seats: 5,
    pricePerDay: 240,
    accent: "#d7e2f0",
    distance: "4.0 mi",
  },
];
