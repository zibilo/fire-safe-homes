import { z } from 'zod';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const fileSchema = z
  .any()
  .refine((file) => file?.size <= MAX_FILE_SIZE, `Taille max : 5Mo.`)
  .refine((file) => ACCEPTED_IMAGE_TYPES.includes(file?.type), "Seuls les .jpg, .jpeg, .png et .webp sont acceptés.");

export const houseFormSchema = z.object({
  // Step 1
  ownerName: z.string().min(2, "Le nom est obligatoire"),
  idCardRectoFile: fileSchema.optional(),
  idCardVersoFile: fileSchema.optional(),
  propertyType: z.enum(["house", "apartment", "company"], { required_error: "Veuillez sélectionner un type de propriété." }),

  // Step 2
  city: z.string().min(2, "La ville est obligatoire"),
  district: z.string().min(2, "Le quartier est obligatoire"),
  neighborhood: z.string().min(2, "Le secteur est obligatoire"),
  street: z.string().min(2, "La rue est obligatoire"),
  parcelNumber: z.string().min(1, "Le numéro de parcelle est obligatoire"),
  phone: z.string().min(4, "Le téléphone est obligatoire"),
  buildingName: z.string().optional(),
  floorNumber: z.number().optional(),
  apartmentNumber: z.string().optional(),
  totalFloors: z.number().optional(),
  elevatorAvailable: z.boolean().optional(),

  // Step 3
  description: z.string().optional(),
  documentsUrls: z.array(z.string()).optional(),
  photosUrls: z.array(z.string()).optional(),
  planUrl: z.string().optional(),

  // Step 4
  numberOfRooms: z.number({ required_error: "Le nombre de pièces est obligatoire." }).min(1),
  surfaceArea: z.number({ required_error: "La surface est obligatoire." }).min(1),
  constructionYear: z.number({ required_error: "L'année est obligatoire." }).min(1900),
  heatingType: z.string().min(2, "Ce champ est obligatoire"),

  // Step 5
  sensitiveObjects: z.string().optional(),
  securityNotes: z.string().optional(),
});

export type HouseFormData = z.infer<typeof houseFormSchema>;
