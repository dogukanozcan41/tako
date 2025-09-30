import { 
  DamageRecord, 
  InsertDamageRecord, 
  UpdateDamageRecord,
  Model,
  InsertModel,
  Settings,
  InsertSettings,
  ChassisData,
  InsertChassisData,
  User,
  InsertUser,
  UpdateUser
} from "@shared/schema";

export interface IStorage {
  // Damage Records
  getDamageRecords(): Promise<DamageRecord[]>;
  getDamageRecord(id: number): Promise<DamageRecord | undefined>;
  getDamageRecordByChassisNumber(chassisNumber: string): Promise<DamageRecord | undefined>;
  createDamageRecord(record: InsertDamageRecord): Promise<DamageRecord>;
  updateDamageRecord(id: number, record: Partial<UpdateDamageRecord>): Promise<DamageRecord | undefined>;
  deleteDamageRecord(id: number): Promise<boolean>;
  
  // Models
  getModels(): Promise<Model[]>;
  getModel(id: number): Promise<Model | undefined>;
  createModel(model: InsertModel): Promise<Model>;
  deleteModel(id: number): Promise<boolean>;
  
  // Settings
  getSettings(): Promise<Settings>;
  updateSettings(settings: InsertSettings): Promise<Settings>;
  
  // Chassis Data
  getChassisData(): Promise<ChassisData[]>;
  getChassisDataByNumber(chassisNumber: string): Promise<ChassisData | undefined>;
  createChassisData(chassisData: InsertChassisData): Promise<ChassisData>;
  bulkCreateChassisData(chassisDataList: InsertChassisData[]): Promise<ChassisData[]>;
  addChassisData(chassisDataList: InsertChassisData[]): Promise<ChassisData[]>;
  clearChassisData(): Promise<boolean>;
  
  // Users
  getUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<UpdateUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private damageRecords: Map<number, DamageRecord>;
  private models: Map<number, Model>;
  private chassisData: Map<number, ChassisData>;
  private users: Map<number, User>;
  private settings: Settings;
  private currentDamageRecordId: number;
  private currentModelId: number;
  private currentChassisDataId: number;
  private currentUserId: number;

  constructor() {
    this.damageRecords = new Map();
    this.models = new Map();
    this.chassisData = new Map();
    this.users = new Map();
    this.currentDamageRecordId = 1;
    this.currentModelId = 1;
    this.currentChassisDataId = 1;
    this.currentUserId = 1;
    
    // Initialize default settings
    this.settings = {
      id: 1,
      title: "HASAR TAKİP SİSTEMİ",
      merturOfficial: "MERTUR YETKİLİSİ",
      omsanOfficial: "OMSAN YETKİLİSİ",
      footerNote: "ARAÇ İÇİ EKSİKLİKLERDEN OMSAN SORUMLU DEĞİLDİR."
    };

    // No default models - start with empty models list
  }

  async getDamageRecords(): Promise<DamageRecord[]> {
    return Array.from(this.damageRecords.values());
  }

  async getDamageRecord(id: number): Promise<DamageRecord | undefined> {
    return this.damageRecords.get(id);
  }

  async getDamageRecordByChassisNumber(chassisNumber: string): Promise<DamageRecord | undefined> {
    return Array.from(this.damageRecords.values()).find(
      record => record.chassisNumber.toLowerCase() === chassisNumber.toLowerCase()
    );
  }

  async createDamageRecord(insertRecord: InsertDamageRecord): Promise<DamageRecord> {
    const id = this.currentDamageRecordId++;
    const record: DamageRecord = { ...insertRecord, id };
    this.damageRecords.set(id, record);
    return record;
  }

  async updateDamageRecord(id: number, updateRecord: Partial<UpdateDamageRecord>): Promise<DamageRecord | undefined> {
    const existingRecord = this.damageRecords.get(id);
    if (!existingRecord) return undefined;

    const updatedRecord = { ...existingRecord, ...updateRecord };
    this.damageRecords.set(id, updatedRecord);
    return updatedRecord;
  }

  async deleteDamageRecord(id: number): Promise<boolean> {
    return this.damageRecords.delete(id);
  }

  async getModels(): Promise<Model[]> {
    return Array.from(this.models.values());
  }

  async getModel(id: number): Promise<Model | undefined> {
    return this.models.get(id);
  }

  async createModel(insertModel: InsertModel): Promise<Model> {
    const id = this.currentModelId++;
    const model: Model = { ...insertModel, id };
    this.models.set(id, model);
    return model;
  }

  async deleteModel(id: number): Promise<boolean> {
    // Check if model is being used in any damage records
    const damageRecords = Array.from(this.damageRecords.values());
    const modelInUse = damageRecords.some(record => {
      const model = Array.from(this.models.values()).find(m => m.id === id);
      return model && record.model === model.name;
    });

    if (modelInUse) {
      throw new Error("Model is being used in damage records and cannot be deleted");
    }

    return this.models.delete(id);
  }

  async getSettings(): Promise<Settings> {
    return this.settings;
  }

  async updateSettings(newSettings: InsertSettings): Promise<Settings> {
    this.settings = { ...this.settings, ...newSettings };
    return this.settings;
  }

  // Chassis Data methods
  async getChassisData(): Promise<ChassisData[]> {
    return Array.from(this.chassisData.values());
  }

  async getChassisDataByNumber(chassisNumber: string): Promise<ChassisData | undefined> {
    return Array.from(this.chassisData.values()).find(data => data.chassisNumber === chassisNumber);
  }

  async createChassisData(insertChassisData: InsertChassisData): Promise<ChassisData> {
    const id = this.currentChassisDataId++;
    const chassisData: ChassisData = { 
      ...insertChassisData, 
      id, 
      uploadDate: new Date() 
    };
    this.chassisData.set(id, chassisData);
    return chassisData;
  }

  async bulkCreateChassisData(chassisDataList: InsertChassisData[]): Promise<ChassisData[]> {
    // Clear existing data first
    this.chassisData.clear();
    this.currentChassisDataId = 1;
    
    const createdData: ChassisData[] = [];
    for (const data of chassisDataList) {
      const id = this.currentChassisDataId++;
      const chassisData: ChassisData = { 
        ...data, 
        id, 
        uploadDate: new Date() 
      };
      this.chassisData.set(id, chassisData);
      createdData.push(chassisData);
    }
    return createdData;
  }

  async addChassisData(chassisDataList: InsertChassisData[]): Promise<ChassisData[]> {
    // Add new data without clearing existing
    const createdData: ChassisData[] = [];
    
    for (const data of chassisDataList) {
      // Check if chassis already exists
      const existingChassis = Array.from(this.chassisData.values()).find(
        item => item.chassisNumber === data.chassisNumber
      );
      
      if (!existingChassis) {
        const id = this.currentChassisDataId++;
        const chassisData: ChassisData = { 
          ...data, 
          id, 
          uploadDate: new Date() 
        };
        this.chassisData.set(id, chassisData);
        createdData.push(chassisData);
      }
    }
    
    return createdData;
  }

  async clearChassisData(): Promise<boolean> {
    this.chassisData.clear();
    return true;
  }

  // Users methods
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      user => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date() 
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updateUser: Partial<UpdateUser>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;

    const updatedUser = { ...existingUser, ...updateUser };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }
}

// Use Excel storage for all operations
import { ExcelStorage } from "./excel-storage";
export const storage = new ExcelStorage();

// Memory storage - for backup/testing only
// export const storage = new MemStorage();
