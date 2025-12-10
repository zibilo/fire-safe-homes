import { useState } from "react";

export interface HouseFormData {
  // Step 1: General Information
  ownerName: string;
  // Ajout de 'company'
  propertyType: "house" | "apartment" | "company";
  
  // Nouveaux champs pour la CNI
  idCardRecto?: string; // URL ou base64
  idCardVerso?: string;
  idCardRectoFile?: File; // Fichier brut pour l'upload
  idCardVersoFile?: File;

  // Step 2: Location
  city: string;
  district: string;
  neighborhood: string;
  street: string;
  parcelNumber: string;
  phone: string;

  // Apartment specific
  buildingName?: string;
  floorNumber?: number;
  apartmentNumber?: string;
  totalFloors?: number;
  elevatorAvailable?: boolean;

  // Step 3: Description & Documents
  description: string;
  documentsUrls: string[];
  photosUrls: string[];
  planUrl?: string;

  // Step 4: House Details
  numberOfRooms?: number;
  surfaceArea?: number;
  constructionYear?: number;
  heatingType?: string;

  // Step 5: Sensitive Objects
  sensitiveObjects: string[];
  securityNotes: string;
}

export const useHouseForm = () => {
  const [formData, setFormData] = useState<HouseFormData>({
    ownerName: "",
    propertyType: "house",
    city: "",
    district: "",
    neighborhood: "",
    street: "",
    parcelNumber: "",
    phone: "",
    description: "", // Sera optionnel à la validation
    documentsUrls: [],
    photosUrls: [],
    sensitiveObjects: [],
    securityNotes: "",
  });

  const updateFormData = (updates: Partial<HouseFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const resetForm = () => {
    setFormData({
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
      idCardRecto: undefined,
      idCardVerso: undefined
    });
  };

  return {
    formData,
    updateFormData,
    resetForm,
  };
};