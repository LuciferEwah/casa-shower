export interface Gift {
  id: string;
  name: string;
  image: string;
  link: string;
  price: number;
  unlimited: boolean;
  reservedBy: string | null;
  reservedByAnimal: string | null;
  reservedByList?: { name: string; animal: string }[];
}

export interface Settings {
  babyName: string;
  eventDate: string;
  eventPlace: string;
  customColor: string;
  babyEmoji: string;
}
