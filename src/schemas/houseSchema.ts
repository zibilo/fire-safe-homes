import { z } from 'zod';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const fileSchema = z
  .any()
  .refine((files) => files?.length == 1, "Une image est requise.")
  .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `La taille maximale du fichier est de 5Mo.`)
  .refine(
    (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
    ".jpg, .jpeg, .png and .webp sont les formats supportés."
  );

export const houseSchema = z.object({
  ownerName: z.string().min(1, { message: "Le nom du propriétaire est requis." }),
  idCardRecto: fileSchema,
  idCardVerso: fileSchema,
  propertyType: z.enum(["house", "apartment", "company"], {
    errorMap: () => ({ message: "Veuillez sélectionner un type de propriété." }),
  }),
  city: z.string().min(1, { message: "La ville est requise." }),
  district: z.string().min(1, { message: "Le district/village est requis." }),
  neighborhood: z.string().min(1, { message: "Le quartier est requis." }),
  street: z.string().min(1, { message: "La rue est requise." }),
  parcelNumber: z.string().min(1, { message: "Le numéro de parcelle est requis." }),
  phone: z.string().min(1, { message: "Le numéro de téléphone est requis." }),
  description: z.string().min(1, { message: "La description est requise." }),

  // Champs conditionnels pour les appartements (optionnels)
  buildingName: z.string().optional(),
  floorNumber: z.number().optional(),
  apartmentNumber: z.string().optional(),
  totalFloors: z.number().optional(),
  elevatorAvailable: z.boolean().optional(),

  // Champs de l'étape 3 (optionnels)
  planUrl: z.string().optional(),

  // Champs de l'étape 4 (optionnels)
  numberOfRooms: z.number().optional(),
  surfaceArea: z.number().optional(),
  constructionYear: z.number().optional(),
  heatingType: z.string().optional(),

  // Champs de l'étape 5 (optionnels)
  sensitiveObjects: z.array(z.string()).optional(),
  securityNotes: z.string().optional(),
});
