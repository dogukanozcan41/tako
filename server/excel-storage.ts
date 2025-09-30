import { promises as fs } from 'fs';
import path from 'path';
import * as bcrypt from 'bcryptjs';
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
import { IStorage } from "./storage";

export class ExcelStorage implements IStorage {
  private dbPath: string;
  private damageRecordsFile: string;
  private modelsFile: string;
  private settingsFile: string;
  private chassisDataFile: string;
  private usersFile: string;

  constructor() {
    this.dbPath = path.join(process.cwd(), 'database', 'excel');
    this.damageRecordsFile = path.join(this.dbPath, 'damage-records.xlsx');
    this.modelsFile = path.join(this.dbPath, 'models.xlsx');
    this.settingsFile = path.join(this.dbPath, 'settings.xlsx');
    this.chassisDataFile = path.join(this.dbPath, 'chassis-data.xlsx');
    this.usersFile = path.join(this.dbPath, 'users.xlsx');
    this.ensureDirectoryExists();
    this.initializeFiles().then(() => {
      this.migratePasswords(); // Migrate plaintext passwords to hashed
    });
  }

  private async ensureDirectoryExists() {
    try {
      await fs.mkdir(this.dbPath, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  private async initializeFiles(): Promise<void> {
    // Initialize damage records file
    await this.ensureExcelFileExists(this.damageRecordsFile, [
      ['id', 'date', 'chassisNumber', 'model', 'description']
    ]);

    // Initialize models file  
    await this.ensureExcelFileExists(this.modelsFile, [
      ['id', 'name']
    ]);

    // Initialize settings file with default values
    await this.ensureExcelFileExists(this.settingsFile, [
      ['id', 'title', 'merturOfficial', 'omsanOfficial', 'footerNote'],
      [1, 'HASAR TAKİP SİSTEMİ', 'MERTUR YETKİLİSİ', 'Hasar Tutanak Yetkilisi', 'ARAÇ İÇİ EKSİKLİKLERDEN OMSAN SORUMLU DEĞİLDİR.']
    ]);

    // Initialize chassis data file
    await this.ensureExcelFileExists(this.chassisDataFile, [
      ['id', 'chassisNumber', 'model', 'uploadDate']
    ]);

    // Initialize users file with default admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await this.ensureExcelFileExists(this.usersFile, [
      ['id', 'username', 'password', 'firstName', 'lastName', 'role', 'createdAt'],
      [1, 'admin', hashedPassword, 'Admin', 'Kullanıcı', 'admin', new Date().toISOString()]
    ]);
  }

  private async ensureExcelFileExists(filePath: string, defaultData: any[][]) {
    try {
      await fs.access(filePath);
    } catch (error) {
      // File doesn't exist, create it
      const XLSX = await import('xlsx');
      const worksheet = XLSX.utils.aoa_to_sheet(defaultData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      XLSX.writeFile(workbook, filePath);
    }
  }

  private async readExcelFile(filePath: string): Promise<any[]> {
    try {
      const xlsxMod = await import('xlsx');
      const XLSX = (xlsxMod.default ?? xlsxMod) as any; // handle default export variance
      const buf = await fs.readFile(filePath); // using already-imported fs.promises
      const workbook = XLSX.read(buf, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      return XLSX.utils.sheet_to_json(worksheet);
    } catch (error) {
      console.error(`Error reading Excel file ${filePath}:`, error);
      return [];
    }
  }

  private async writeExcelFile(filePath: string, data: any[], headers: string[]) {
    try {
      const XLSX = await import('xlsx');
      const worksheetData = [headers, ...data.map(row => headers.map(header => row[header]))];
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      XLSX.writeFile(workbook, filePath);
    } catch (error) {
      console.error(`Error writing Excel file ${filePath}:`, error);
      throw error;
    }
  }

  private getNextId(data: any[]): number {
    if (data.length === 0) return 1;
    const maxId = Math.max(...data.map(item => item.id || 0));
    return maxId + 1;
  }

  // Damage Records Methods
  async getDamageRecords(): Promise<DamageRecord[]> {
    const data = await this.readExcelFile(this.damageRecordsFile);
    return data as DamageRecord[];
  }

  async getDamageRecord(id: number): Promise<DamageRecord | undefined> {
    const records = await this.getDamageRecords();
    return records.find(record => record.id === id);
  }

  async getDamageRecordByChassisNumber(chassisNumber: string): Promise<DamageRecord | undefined> {
    const records = await this.getDamageRecords();
    return records.find(record => record.chassisNumber.toLowerCase() === chassisNumber.toLowerCase());
  }

  async createDamageRecord(insertRecord: InsertDamageRecord): Promise<DamageRecord> {
    const records = await this.getDamageRecords();
    const id = this.getNextId(records);
    const newRecord: DamageRecord = { ...insertRecord, id };
    
    records.push(newRecord);
    await this.writeExcelFile(this.damageRecordsFile, records, ['id', 'date', 'chassisNumber', 'model', 'description']);
    
    return newRecord;
  }

  async updateDamageRecord(id: number, updateRecord: Partial<UpdateDamageRecord>): Promise<DamageRecord | undefined> {
    const records = await this.getDamageRecords();
    const index = records.findIndex(record => record.id === id);
    
    if (index === -1) return undefined;
    
    records[index] = { ...records[index], ...updateRecord };
    await this.writeExcelFile(this.damageRecordsFile, records, ['id', 'date', 'chassisNumber', 'model', 'description']);
    
    return records[index];
  }

  async deleteDamageRecord(id: number): Promise<boolean> {
    const records = await this.getDamageRecords();
    const filteredRecords = records.filter(record => record.id !== id);
    
    if (filteredRecords.length === records.length) return false;
    
    await this.writeExcelFile(this.damageRecordsFile, filteredRecords, ['id', 'date', 'chassisNumber', 'model', 'description']);
    return true;
  }

  // Models Methods
  async getModels(): Promise<Model[]> {
    const data = await this.readExcelFile(this.modelsFile);
    return data as Model[];
  }

  async getModel(id: number): Promise<Model | undefined> {
    const models = await this.getModels();
    return models.find(model => model.id === id);
  }

  async createModel(insertModel: InsertModel): Promise<Model> {
    const models = await this.getModels();
    const id = this.getNextId(models);
    const newModel: Model = { ...insertModel, id };
    
    models.push(newModel);
    await this.writeExcelFile(this.modelsFile, models, ['id', 'name']);
    
    return newModel;
  }

  async deleteModel(id: number): Promise<boolean> {
    // Check if model is being used in damage records
    const damageRecords = await this.getDamageRecords();
    const models = await this.getModels();
    const model = models.find(m => m.id === id);
    
    if (model) {
      const modelInUse = damageRecords.some(record => record.model === model.name);
      if (modelInUse) {
        throw new Error("Model is being used in damage records and cannot be deleted");
      }
    }
    
    const filteredModels = models.filter(model => model.id !== id);
    
    if (filteredModels.length === models.length) return false;
    
    await this.writeExcelFile(this.modelsFile, filteredModels, ['id', 'name']);
    return true;
  }

  // Settings Methods
  async getSettings(): Promise<Settings> {
    const data = await this.readExcelFile(this.settingsFile);
    return data[0] as Settings || {
      id: 1,
      title: "HASAR TAKİP SİSTEMİ",
      merturOfficial: "MERTUR YETKİLİSİ",
      omsanOfficial: "OMSAN YETKİLİSİ",
      footerNote: "ARAÇ İÇİ EKSİKLİKLERDEN OMSAN SORUMLU DEĞİLDİR."
    };
  }

  async updateSettings(newSettings: InsertSettings): Promise<Settings> {
    const updatedSettings: Settings = { id: 1, ...newSettings };
    await this.writeExcelFile(this.settingsFile, [updatedSettings], ['id', 'title', 'merturOfficial', 'omsanOfficial', 'footerNote']);
    return updatedSettings;
  }

  // Chassis Data Methods
  async getChassisData(): Promise<ChassisData[]> {
    const data = await this.readExcelFile(this.chassisDataFile);
    return data.map(item => ({
      ...item,
      uploadDate: item.uploadDate ? new Date(item.uploadDate) : new Date()
    })) as ChassisData[];
  }

  async getChassisDataByNumber(chassisNumber: string): Promise<ChassisData | undefined> {
    const chassisDataList = await this.getChassisData();
    return chassisDataList.find(data => data.chassisNumber === chassisNumber);
  }

  async createChassisData(insertChassisData: InsertChassisData): Promise<ChassisData> {
    const chassisDataList = await this.getChassisData();
    const id = this.getNextId(chassisDataList);
    const newChassisData: ChassisData = { 
      ...insertChassisData, 
      id, 
      uploadDate: new Date() 
    };
    
    chassisDataList.push(newChassisData);
    await this.writeExcelFile(this.chassisDataFile, chassisDataList.map(item => ({
      ...item,
      uploadDate: item.uploadDate.toISOString()
    })), ['id', 'chassisNumber', 'model', 'uploadDate']);
    
    return newChassisData;
  }

  async bulkCreateChassisData(chassisDataList: InsertChassisData[]): Promise<ChassisData[]> {
    // Clear existing data first
    await this.clearChassisData();
    
    const createdData: ChassisData[] = [];
    let id = 1;
    
    for (const data of chassisDataList) {
      const chassisData: ChassisData = { 
        ...data, 
        id: id++, 
        uploadDate: new Date() 
      };
      createdData.push(chassisData);
    }
    
    await this.writeExcelFile(this.chassisDataFile, createdData.map(item => ({
      ...item,
      uploadDate: item.uploadDate.toISOString()
    })), ['id', 'chassisNumber', 'model', 'uploadDate']);
    
    return createdData;
  }

  async addChassisData(chassisDataList: InsertChassisData[]): Promise<ChassisData[]> {
    const existingData = await this.getChassisData();
    const createdData: ChassisData[] = [];
    
    for (const data of chassisDataList) {
      // Check if chassis already exists
      const existingChassis = existingData.find(item => item.chassisNumber === data.chassisNumber);
      
      if (!existingChassis) {
        const id = this.getNextId([...existingData, ...createdData]);
        const chassisData: ChassisData = { 
          ...data, 
          id, 
          uploadDate: new Date() 
        };
        createdData.push(chassisData);
      }
    }
    
    const allData = [...existingData, ...createdData];
    await this.writeExcelFile(this.chassisDataFile, allData.map(item => ({
      ...item,
      uploadDate: item.uploadDate.toISOString()
    })), ['id', 'chassisNumber', 'model', 'uploadDate']);
    
    return createdData;
  }

  async clearChassisData(): Promise<boolean> {
    await this.writeExcelFile(this.chassisDataFile, [], ['id', 'chassisNumber', 'model', 'uploadDate']);
    return true;
  }

  // Users Methods
  async getUsers(): Promise<User[]> {
    const data = await this.readExcelFile(this.usersFile);
    return data.map(item => ({
      ...item,
      createdAt: item.createdAt ? new Date(item.createdAt) : new Date()
    })) as User[];
  }

  async getUser(id: number): Promise<User | undefined> {
    const users = await this.getUsers();
    return users.find(user => user.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const users = await this.getUsers();
    return users.find(user => user.username.toLowerCase() === username.toLowerCase());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const users = await this.getUsers();
    const id = this.getNextId(users);
    const newUser: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date() 
    };
    
    users.push(newUser);
    await this.writeExcelFile(this.usersFile, users.map(user => ({
      ...user,
      createdAt: user.createdAt.toISOString()
    })), ['id', 'username', 'password', 'firstName', 'lastName', 'role', 'createdAt']);
    
    return newUser;
  }

  async updateUser(id: number, updateUser: Partial<UpdateUser>): Promise<User | undefined> {
    const users = await this.getUsers();
    const index = users.findIndex(user => user.id === id);
    
    if (index === -1) return undefined;
    
    users[index] = { ...users[index], ...updateUser };
    await this.writeExcelFile(this.usersFile, users.map(user => ({
      ...user,
      createdAt: user.createdAt.toISOString()
    })), ['id', 'username', 'password', 'firstName', 'lastName', 'role', 'createdAt']);
    
    return users[index];
  }

  async deleteUser(id: number): Promise<boolean> {
    const users = await this.getUsers();
    const filteredUsers = users.filter(user => user.id !== id);
    
    if (filteredUsers.length === users.length) return false;
    
    await this.writeExcelFile(this.usersFile, filteredUsers.map(user => ({
      ...user,
      createdAt: user.createdAt.toISOString()
    })), ['id', 'username', 'password', 'firstName', 'lastName', 'role', 'createdAt']);
    
    return true;
  }

  // Migrate plaintext passwords to bcrypt hashes
  private async migratePasswords(): Promise<void> {
    try {
      const users = await this.getUsers();
      let needsMigration = false;
      
      const migratedUsers = await Promise.all(users.map(async (user) => {
        // Check if password is already hashed (bcrypt hashes start with $2)
        if (!user.password.startsWith('$2')) {
          needsMigration = true;
          console.log(`Migrating password for user: ${user.username}`);
          return {
            ...user,
            password: await bcrypt.hash(user.password, 10)
          };
        }
        return user;
      }));

      if (needsMigration) {
        console.log('Migrating user passwords to bcrypt hashes...');
        await this.writeExcelFile(this.usersFile, migratedUsers.map(user => ({
          ...user,
          createdAt: user.createdAt.toISOString()
        })), ['id', 'username', 'password', 'firstName', 'lastName', 'role', 'createdAt']);
        console.log('Password migration completed successfully!');
      }
    } catch (error) {
      console.error('Password migration failed:', error);
      // Don't throw - let the app continue to work
    }
  }
}