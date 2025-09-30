import { z } from "zod";

// Excel tabanlı veritabanı için TypeScript tipleri

// User interface for authentication system
export interface User {
  id: number;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'user';
  createdAt: Date;
}
export interface DamageRecord {
  id: number;
  date: string;
  chassisNumber: string;
  model: string;
  description: string;
}

export interface Model {
  id: number;
  name: string;
}

export interface Settings {
  id: number;
  title: string;
  merturOfficial: string;
  omsanOfficial: string;
  footerNote: string;
}

export interface ChassisData {
  id: number;
  chassisNumber: string;
  model: string;
  uploadDate: Date;
}

// Zod validation schemas
export const insertDamageRecordSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tarih YYYY-MM-DD formatında olmalıdır"),
  chassisNumber: z.string().min(1, "Şasi numarası gerekli"),
  model: z.string().min(1, "Model gerekli"),
  description: z.string().min(1, "Hasar tanımı gerekli"),
});

export const insertModelSchema = z.object({
  name: z.string().min(1, "Model adı gerekli"),
});

export const insertSettingsSchema = z.object({
  title: z.string().min(1, "Başlık gerekli"),
  merturOfficial: z.string().min(1, "Mertur yetkili gerekli"),
  omsanOfficial: z.string().min(1, "Omsan yetkili gerekli"),
  footerNote: z.string().min(1, "Dipnot gerekli"),
});

export const insertChassisDataSchema = z.object({
  chassisNumber: z.string().min(1, "Şasi numarası gerekli"),
  model: z.string().min(1, "Model gerekli"),
});

export const updateDamageRecordSchema = z.object({
  id: z.number(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tarih YYYY-MM-DD formatında olmalıdır"),
  model: z.string().min(1, "Model gerekli"),
  description: z.string().min(1, "Hasar tanımı gerekli"),
});

// User validation schemas
export const insertUserSchema = z.object({
  username: z.string().min(3, "Kullanıcı adı en az 3 karakter olmalıdır"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
  firstName: z.string().min(1, "Ad gerekli"),
  lastName: z.string().min(1, "Soyad gerekli"),
  role: z.enum(['admin', 'user']).default('user'),
});

export const updateUserSchema = z.object({
  id: z.number(),
  username: z.string().min(3, "Kullanıcı adı en az 3 karakter olmalıdır").optional(),
  password: z.string().min(6, "Şifre en az 6 karakter olmalıdır").optional(),
  firstName: z.string().min(1, "Ad gerekli").optional(),
  lastName: z.string().min(1, "Soyad gerekli").optional(),
  role: z.enum(['admin', 'user']).optional(),
});

export const loginSchema = z.object({
  username: z.string().min(1, "Kullanıcı adı gerekli"),
  password: z.string().min(1, "Şifre gerekli"),
});

// Type exports
export type InsertDamageRecord = z.infer<typeof insertDamageRecordSchema>;
export type UpdateDamageRecord = z.infer<typeof updateDamageRecordSchema>;
export type InsertModel = z.infer<typeof insertModelSchema>;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type InsertChassisData = z.infer<typeof insertChassisDataSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type LoginData = z.infer<typeof loginSchema>;