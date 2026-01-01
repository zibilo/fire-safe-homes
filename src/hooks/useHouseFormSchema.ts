import { z } from "zod";

// Schéma de validation pour le formulaire d'enregistrement de maison
export const houseFormSchema = z.object({
  // Step 1: Identité
  ownerName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  propertyType: z.enum(["house", "apartment", "company"]),
  idCardRecto: z.string().optional(),
  idCardVerso: z.string().optional(),
  
  // Step 2: Localisation
  city: z.string().min(2, "La ville est obligatoire"),
  district: z.string().min(2, "Le district est obligatoire"),
  neighborhood: z.string().min(2, "Le quartier est obligatoire"),
  street: z.string().min(2, "La rue est obligatoire"),
  parcelNumber: z.string().min(1, "Le numéro de parcelle est obligatoire"),
  phone: z.string().min(8, "Numéro de téléphone invalide"),
  
  // Appartement
  buildingName: z.string().optional(),
  floorNumber: z.number().optional(),
  apartmentNumber: z.string().optional(),
  totalFloors: z.number().optional(),
  elevatorAvailable: z.boolean().optional(),
  
  // Step 3: Documents
  description: z.string().optional(),
  planUrl: z.string().optional(),
  documentsUrls: z.array(z.string()).default([]),
  photosUrls: z.array(z.string()).default([]),
  
  // Step 4: Caractéristiques
  numberOfRooms: z.number().min(1, "Nombre de pièces obligatoire").optional(),
  surfaceArea: z.number().min(1, "Surface obligatoire").optional(),
  constructionYear: z.number().min(1800, "Année invalide").max(2030, "Année invalide").optional(),
  heatingType: z.string().optional(),
  
  // Step 5: Sécurité
  sensitiveObjects: z.array(z.string()).default([]),
  securityNotes: z.string().optional(),
});

export type HouseFormSchemaType = z.infer<typeof houseFormSchema>;

// Schémas partiels pour validation par étape
export const stepOneSchema = houseFormSchema.pick({
  ownerName: true,
  propertyType: true,
  idCardRecto: true,
  idCardVerso: true,
});

export const stepTwoSchema = houseFormSchema.pick({
  city: true,
  district: true,
  neighborhood: true,
  street: true,
  parcelNumber: true,
  phone: true,
  buildingName: true,
  floorNumber: true,
  apartmentNumber: true,
  totalFloors: true,
  elevatorAvailable: true,
});

export const stepThreeSchema = houseFormSchema.pick({
  description: true,
  planUrl: true,
  documentsUrls: true,
  photosUrls: true,
});

export const stepFourSchema = houseFormSchema.pick({
  numberOfRooms: true,
  surfaceArea: true,
  constructionYear: true,
  heatingType: true,
});

export const stepFiveSchema = houseFormSchema.pick({
  sensitiveObjects: true,
  securityNotes: true,
});

export const defaultFormValues: HouseFormSchemaType = {
  ownerName: "",
  propertyType: "house",
  city: "",
  district: "",
  neighborhood: "",
  street: "",
  parcelNumber: "",
  phone: "",
  description: "",
  documentsUrls: [],
  photosUrls: [],
  sensitiveObjects: [],
  securityNotes: "",
};
