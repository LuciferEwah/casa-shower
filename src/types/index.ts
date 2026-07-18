export interface Gift {
  id: string;
  name: string;
  image: string;
  link: string;
  price: number;
  unlimited: boolean;
  neededQuantity?: number;
  /** Mínimo de unidades por reserva (no se puede bajar de este valor). Default 1. */
  minQuantity?: number;
  reservedCount?: number;
  reservedBy: string | null;
  reservedByAnimal: string | null;
  reservedByEmail?: string | null;
  reservedByList?: { name: string; animal: string; email?: string }[];
  hidden?: boolean;
}

export interface Settings {
  babyName: string;
  eventDate: string;
  eventPlace: string;
  customColor: string;
  babyEmoji: string;
  welcomeMessage?: string;
}
