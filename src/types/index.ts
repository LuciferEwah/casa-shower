export interface Gift {
  id: string;
  name: string;
  image: string;
  link: string;
  price: number;
  unlimited: boolean;
  neededQuantity?: number;
  reservedCount?: number;
  reservedBy: string | null;
  reservedByAnimal: string | null;
  reservedByEmail?: string | null;
  reservedByList?: { name: string; animal: string; email?: string }[];
}

export interface Settings {
  babyName: string;
  eventDate: string;
  eventPlace: string;
  customColor: string;
  babyEmoji: string;
  welcomeMessage?: string;
}
