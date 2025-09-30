// server/index.ts
import express2 from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";

// server/routes.ts
import { createServer } from "http";
import * as bcrypt2 from "bcryptjs";

// server/excel-storage.ts
import { promises as fs } from "fs";
import path from "path";
import * as bcrypt from "bcryptjs";
var ExcelStorage = class {
  dbPath;
  damageRecordsFile;
  modelsFile;
  settingsFile;
  chassisDataFile;
  usersFile;
  constructor() {
    this.dbPath = path.join(process.cwd(), "database", "excel");
    this.damageRecordsFile = path.join(this.dbPath, "damage-records.xlsx");
    this.modelsFile = path.join(this.dbPath, "models.xlsx");
    this.settingsFile = path.join(this.dbPath, "settings.xlsx");
    this.chassisDataFile = path.join(this.dbPath, "chassis-data.xlsx");
    this.usersFile = path.join(this.dbPath, "users.xlsx");
    this.ensureDirectoryExists();
    this.initializeFiles().then(() => {
      this.migratePasswords();
    });
  }
  async ensureDirectoryExists() {
    try {
      await fs.mkdir(this.dbPath, { recursive: true });
    } catch (error) {
    }
  }
  async initializeFiles() {
    await this.ensureExcelFileExists(this.damageRecordsFile, [
      ["id", "date", "chassisNumber", "model", "description"]
    ]);
    await this.ensureExcelFileExists(this.modelsFile, [
      ["id", "name"]
    ]);
    await this.ensureExcelFileExists(this.settingsFile, [
      ["id", "title", "merturOfficial", "omsanOfficial", "footerNote"],
      [1, "HASAR TAK\u0130P S\u0130STEM\u0130", "MERTUR YETK\u0130L\u0130S\u0130", "Hasar Tutanak Yetkilisi", "ARA\xC7 \u0130\xC7\u0130 EKS\u0130KL\u0130KLERDEN OMSAN SORUMLU DE\u011E\u0130LD\u0130R."]
    ]);
    await this.ensureExcelFileExists(this.chassisDataFile, [
      ["id", "chassisNumber", "model", "uploadDate"]
    ]);
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await this.ensureExcelFileExists(this.usersFile, [
      ["id", "username", "password", "firstName", "lastName", "role", "createdAt"],
      [1, "admin", hashedPassword, "Admin", "Kullan\u0131c\u0131", "admin", (/* @__PURE__ */ new Date()).toISOString()]
    ]);
  }
  async ensureExcelFileExists(filePath, defaultData) {
    try {
      await fs.access(filePath);
    } catch (error) {
      const XLSX = await import("xlsx");
      const worksheet = XLSX.utils.aoa_to_sheet(defaultData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
      XLSX.writeFile(workbook, filePath);
    }
  }
  async readExcelFile(filePath) {
    try {
      const xlsxMod = await import("xlsx");
      const XLSX = xlsxMod.default ?? xlsxMod;
      const buf = await fs.readFile(filePath);
      const workbook = XLSX.read(buf, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      return XLSX.utils.sheet_to_json(worksheet);
    } catch (error) {
      console.error(`Error reading Excel file ${filePath}:`, error);
      return [];
    }
  }
  async writeExcelFile(filePath, data, headers) {
    try {
      const XLSX = await import("xlsx");
      const worksheetData = [headers, ...data.map((row) => headers.map((header) => row[header]))];
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
      XLSX.writeFile(workbook, filePath);
    } catch (error) {
      console.error(`Error writing Excel file ${filePath}:`, error);
      throw error;
    }
  }
  getNextId(data) {
    if (data.length === 0) return 1;
    const maxId = Math.max(...data.map((item) => item.id || 0));
    return maxId + 1;
  }
  // Damage Records Methods
  async getDamageRecords() {
    const data = await this.readExcelFile(this.damageRecordsFile);
    return data;
  }
  async getDamageRecord(id) {
    const records = await this.getDamageRecords();
    return records.find((record) => record.id === id);
  }
  async getDamageRecordByChassisNumber(chassisNumber) {
    const records = await this.getDamageRecords();
    return records.find((record) => record.chassisNumber.toLowerCase() === chassisNumber.toLowerCase());
  }
  async createDamageRecord(insertRecord) {
    const records = await this.getDamageRecords();
    const id = this.getNextId(records);
    const newRecord = { ...insertRecord, id };
    records.push(newRecord);
    await this.writeExcelFile(this.damageRecordsFile, records, ["id", "date", "chassisNumber", "model", "description"]);
    return newRecord;
  }
  async updateDamageRecord(id, updateRecord) {
    const records = await this.getDamageRecords();
    const index = records.findIndex((record) => record.id === id);
    if (index === -1) return void 0;
    records[index] = { ...records[index], ...updateRecord };
    await this.writeExcelFile(this.damageRecordsFile, records, ["id", "date", "chassisNumber", "model", "description"]);
    return records[index];
  }
  async deleteDamageRecord(id) {
    const records = await this.getDamageRecords();
    const filteredRecords = records.filter((record) => record.id !== id);
    if (filteredRecords.length === records.length) return false;
    await this.writeExcelFile(this.damageRecordsFile, filteredRecords, ["id", "date", "chassisNumber", "model", "description"]);
    return true;
  }
  // Models Methods
  async getModels() {
    const data = await this.readExcelFile(this.modelsFile);
    return data;
  }
  async getModel(id) {
    const models = await this.getModels();
    return models.find((model) => model.id === id);
  }
  async createModel(insertModel) {
    const models = await this.getModels();
    const id = this.getNextId(models);
    const newModel = { ...insertModel, id };
    models.push(newModel);
    await this.writeExcelFile(this.modelsFile, models, ["id", "name"]);
    return newModel;
  }
  async deleteModel(id) {
    const damageRecords = await this.getDamageRecords();
    const models = await this.getModels();
    const model = models.find((m) => m.id === id);
    if (model) {
      const modelInUse = damageRecords.some((record) => record.model === model.name);
      if (modelInUse) {
        throw new Error("Model is being used in damage records and cannot be deleted");
      }
    }
    const filteredModels = models.filter((model2) => model2.id !== id);
    if (filteredModels.length === models.length) return false;
    await this.writeExcelFile(this.modelsFile, filteredModels, ["id", "name"]);
    return true;
  }
  // Settings Methods
  async getSettings() {
    const data = await this.readExcelFile(this.settingsFile);
    return data[0] || {
      id: 1,
      title: "HASAR TAK\u0130P S\u0130STEM\u0130",
      merturOfficial: "MERTUR YETK\u0130L\u0130S\u0130",
      omsanOfficial: "OMSAN YETK\u0130L\u0130S\u0130",
      footerNote: "ARA\xC7 \u0130\xC7\u0130 EKS\u0130KL\u0130KLERDEN OMSAN SORUMLU DE\u011E\u0130LD\u0130R."
    };
  }
  async updateSettings(newSettings) {
    const updatedSettings = { id: 1, ...newSettings };
    await this.writeExcelFile(this.settingsFile, [updatedSettings], ["id", "title", "merturOfficial", "omsanOfficial", "footerNote"]);
    return updatedSettings;
  }
  // Chassis Data Methods
  async getChassisData() {
    const data = await this.readExcelFile(this.chassisDataFile);
    return data.map((item) => ({
      ...item,
      uploadDate: item.uploadDate ? new Date(item.uploadDate) : /* @__PURE__ */ new Date()
    }));
  }
  async getChassisDataByNumber(chassisNumber) {
    const chassisDataList = await this.getChassisData();
    return chassisDataList.find((data) => data.chassisNumber === chassisNumber);
  }
  async createChassisData(insertChassisData) {
    const chassisDataList = await this.getChassisData();
    const id = this.getNextId(chassisDataList);
    const newChassisData = {
      ...insertChassisData,
      id,
      uploadDate: /* @__PURE__ */ new Date()
    };
    chassisDataList.push(newChassisData);
    await this.writeExcelFile(this.chassisDataFile, chassisDataList.map((item) => ({
      ...item,
      uploadDate: item.uploadDate.toISOString()
    })), ["id", "chassisNumber", "model", "uploadDate"]);
    return newChassisData;
  }
  async bulkCreateChassisData(chassisDataList) {
    await this.clearChassisData();
    const createdData = [];
    let id = 1;
    for (const data of chassisDataList) {
      const chassisData = {
        ...data,
        id: id++,
        uploadDate: /* @__PURE__ */ new Date()
      };
      createdData.push(chassisData);
    }
    await this.writeExcelFile(this.chassisDataFile, createdData.map((item) => ({
      ...item,
      uploadDate: item.uploadDate.toISOString()
    })), ["id", "chassisNumber", "model", "uploadDate"]);
    return createdData;
  }
  async addChassisData(chassisDataList) {
    const existingData = await this.getChassisData();
    const createdData = [];
    for (const data of chassisDataList) {
      const existingChassis = existingData.find((item) => item.chassisNumber === data.chassisNumber);
      if (!existingChassis) {
        const id = this.getNextId([...existingData, ...createdData]);
        const chassisData = {
          ...data,
          id,
          uploadDate: /* @__PURE__ */ new Date()
        };
        createdData.push(chassisData);
      }
    }
    const allData = [...existingData, ...createdData];
    await this.writeExcelFile(this.chassisDataFile, allData.map((item) => ({
      ...item,
      uploadDate: item.uploadDate.toISOString()
    })), ["id", "chassisNumber", "model", "uploadDate"]);
    return createdData;
  }
  async clearChassisData() {
    await this.writeExcelFile(this.chassisDataFile, [], ["id", "chassisNumber", "model", "uploadDate"]);
    return true;
  }
  // Users Methods
  async getUsers() {
    const data = await this.readExcelFile(this.usersFile);
    return data.map((item) => ({
      ...item,
      createdAt: item.createdAt ? new Date(item.createdAt) : /* @__PURE__ */ new Date()
    }));
  }
  async getUser(id) {
    const users = await this.getUsers();
    return users.find((user) => user.id === id);
  }
  async getUserByUsername(username) {
    const users = await this.getUsers();
    return users.find((user) => user.username.toLowerCase() === username.toLowerCase());
  }
  async createUser(insertUser) {
    const users = await this.getUsers();
    const id = this.getNextId(users);
    const newUser = {
      ...insertUser,
      id,
      createdAt: /* @__PURE__ */ new Date()
    };
    users.push(newUser);
    await this.writeExcelFile(this.usersFile, users.map((user) => ({
      ...user,
      createdAt: user.createdAt.toISOString()
    })), ["id", "username", "password", "firstName", "lastName", "role", "createdAt"]);
    return newUser;
  }
  async updateUser(id, updateUser) {
    const users = await this.getUsers();
    const index = users.findIndex((user) => user.id === id);
    if (index === -1) return void 0;
    users[index] = { ...users[index], ...updateUser };
    await this.writeExcelFile(this.usersFile, users.map((user) => ({
      ...user,
      createdAt: user.createdAt.toISOString()
    })), ["id", "username", "password", "firstName", "lastName", "role", "createdAt"]);
    return users[index];
  }
  async deleteUser(id) {
    const users = await this.getUsers();
    const filteredUsers = users.filter((user) => user.id !== id);
    if (filteredUsers.length === users.length) return false;
    await this.writeExcelFile(this.usersFile, filteredUsers.map((user) => ({
      ...user,
      createdAt: user.createdAt.toISOString()
    })), ["id", "username", "password", "firstName", "lastName", "role", "createdAt"]);
    return true;
  }
  // Migrate plaintext passwords to bcrypt hashes
  async migratePasswords() {
    try {
      const users = await this.getUsers();
      let needsMigration = false;
      const migratedUsers = await Promise.all(users.map(async (user) => {
        if (!user.password.startsWith("$2")) {
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
        console.log("Migrating user passwords to bcrypt hashes...");
        await this.writeExcelFile(this.usersFile, migratedUsers.map((user) => ({
          ...user,
          createdAt: user.createdAt.toISOString()
        })), ["id", "username", "password", "firstName", "lastName", "role", "createdAt"]);
        console.log("Password migration completed successfully!");
      }
    } catch (error) {
      console.error("Password migration failed:", error);
    }
  }
};

// server/storage.ts
var storage = new ExcelStorage();

// server/middleware/auth.ts
var authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace("Bearer ", "") || req.headers["x-auth-token"];
    if (!token) {
      return res.status(401).json({ message: "Access token gerekli" });
    }
    if (!token.startsWith("user_authenticated_")) {
      return res.status(401).json({ message: "Ge\xE7ersiz token" });
    }
    const username = req.headers["x-username"];
    if (!username) {
      return res.status(401).json({ message: "User bilgisi eksik" });
    }
    const user = await storage.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ message: "Kullan\u0131c\u0131 bulunamad\u0131" });
    }
    req.user = {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    };
    next();
  } catch (error) {
    return res.status(401).json({ message: "Authentication ba\u015Far\u0131s\u0131z" });
  }
};
var requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication gerekli" });
  }
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin yetkisi gerekli" });
  }
  next();
};
var requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication gerekli" });
  }
  next();
};

// shared/schema.ts
import { z } from "zod";
var insertDamageRecordSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tarih YYYY-MM-DD format\u0131nda olmal\u0131d\u0131r"),
  chassisNumber: z.string().min(1, "\u015Easi numaras\u0131 gerekli"),
  model: z.string().min(1, "Model gerekli"),
  description: z.string().min(1, "Hasar tan\u0131m\u0131 gerekli")
});
var insertModelSchema = z.object({
  name: z.string().min(1, "Model ad\u0131 gerekli")
});
var insertSettingsSchema = z.object({
  title: z.string().min(1, "Ba\u015Fl\u0131k gerekli"),
  merturOfficial: z.string().min(1, "Mertur yetkili gerekli"),
  omsanOfficial: z.string().min(1, "Omsan yetkili gerekli"),
  footerNote: z.string().min(1, "Dipnot gerekli")
});
var insertChassisDataSchema = z.object({
  chassisNumber: z.string().min(1, "\u015Easi numaras\u0131 gerekli"),
  model: z.string().min(1, "Model gerekli")
});
var updateDamageRecordSchema = z.object({
  id: z.number(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tarih YYYY-MM-DD format\u0131nda olmal\u0131d\u0131r"),
  model: z.string().min(1, "Model gerekli"),
  description: z.string().min(1, "Hasar tan\u0131m\u0131 gerekli")
});
var insertUserSchema = z.object({
  username: z.string().min(3, "Kullan\u0131c\u0131 ad\u0131 en az 3 karakter olmal\u0131d\u0131r"),
  password: z.string().min(6, "\u015Eifre en az 6 karakter olmal\u0131d\u0131r"),
  firstName: z.string().min(1, "Ad gerekli"),
  lastName: z.string().min(1, "Soyad gerekli"),
  role: z.enum(["admin", "user"]).default("user")
});
var updateUserSchema = z.object({
  id: z.number(),
  username: z.string().min(3, "Kullan\u0131c\u0131 ad\u0131 en az 3 karakter olmal\u0131d\u0131r").optional(),
  password: z.string().min(6, "\u015Eifre en az 6 karakter olmal\u0131d\u0131r").optional(),
  firstName: z.string().min(1, "Ad gerekli").optional(),
  lastName: z.string().min(1, "Soyad gerekli").optional(),
  role: z.enum(["admin", "user"]).optional()
});
var loginSchema = z.object({
  username: z.string().min(1, "Kullan\u0131c\u0131 ad\u0131 gerekli"),
  password: z.string().min(1, "\u015Eifre gerekli")
});

// server/routes.ts
async function registerRoutes(app2) {
  app2.get("/api/damage-records", authenticate, requireAuth, async (req, res) => {
    try {
      const records = await storage.getDamageRecords();
      res.json(records);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch damage records" });
    }
  });
  app2.get("/api/damage-records/:id", authenticate, requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const record = await storage.getDamageRecord(id);
      if (!record) {
        return res.status(404).json({ message: "Damage record not found" });
      }
      res.json(record);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch damage record" });
    }
  });
  app2.post("/api/damage-records", authenticate, requireAuth, async (req, res) => {
    try {
      const validatedData = insertDamageRecordSchema.parse(req.body);
      const existingRecord = await storage.getDamageRecordByChassisNumber(validatedData.chassisNumber);
      if (existingRecord) {
        return res.status(400).json({
          message: "Chassis number already exists",
          existingRecord
        });
      }
      const record = await storage.createDamageRecord(validatedData);
      res.status(201).json(record);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to create damage record" });
      }
    }
  });
  app2.put("/api/damage-records/:id", authenticate, requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = updateDamageRecordSchema.parse(req.body);
      const record = await storage.updateDamageRecord(id, validatedData);
      if (!record) {
        return res.status(404).json({ message: "Damage record not found" });
      }
      res.json(record);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to update damage record" });
      }
    }
  });
  app2.delete("/api/damage-records/:id", authenticate, requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteDamageRecord(id);
      if (!success) {
        return res.status(404).json({ message: "Damage record not found" });
      }
      res.json({ message: "Damage record deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete damage record" });
    }
  });
  app2.get("/api/models", authenticate, requireAuth, async (req, res) => {
    try {
      const models = await storage.getModels();
      res.json(models);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch models" });
    }
  });
  app2.post("/api/models", authenticate, requireAdmin, async (req, res) => {
    try {
      const validatedData = insertModelSchema.parse(req.body);
      const model = await storage.createModel(validatedData);
      res.status(201).json(model);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to create model" });
      }
    }
  });
  app2.delete("/api/models/:id", authenticate, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteModel(id);
      if (!success) {
        return res.status(404).json({ message: "Model not found" });
      }
      res.json({ message: "Model deleted successfully" });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to delete model" });
      }
    }
  });
  app2.get("/api/settings", authenticate, requireAuth, async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });
  app2.put("/api/settings", authenticate, requireAdmin, async (req, res) => {
    try {
      const validatedData = insertSettingsSchema.parse(req.body);
      const settings = await storage.updateSettings(validatedData);
      res.json(settings);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to update settings" });
      }
    }
  });
  app2.get("/api/chassis-data", authenticate, requireAuth, async (req, res) => {
    try {
      const chassisData = await storage.getChassisData();
      res.json(chassisData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chassis data" });
    }
  });
  app2.get("/api/chassis-data/:chassisNumber", authenticate, requireAuth, async (req, res) => {
    try {
      const chassisNumber = req.params.chassisNumber;
      const chassisData = await storage.getChassisDataByNumber(chassisNumber);
      if (!chassisData) {
        return res.status(404).json({ message: "Chassis data not found" });
      }
      res.json(chassisData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chassis data" });
    }
  });
  app2.post("/api/chassis-data/bulk", authenticate, requireAdmin, async (req, res) => {
    try {
      await storage.clearChassisData();
      const validatedData = req.body.map((item) => insertChassisDataSchema.parse(item));
      const createdData = await storage.bulkCreateChassisData(validatedData);
      res.status(201).json(createdData);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to create chassis data" });
      }
    }
  });
  app2.post("/api/chassis-data/add", authenticate, requireAdmin, async (req, res) => {
    try {
      const validatedData = req.body.map((item) => insertChassisDataSchema.parse(item));
      const createdData = await storage.addChassisData(validatedData);
      res.status(201).json(createdData);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to add chassis data" });
      }
    }
  });
  app2.delete("/api/chassis-data", authenticate, requireAdmin, async (req, res) => {
    try {
      const success = await storage.clearChassisData();
      if (!success) {
        return res.status(500).json({ message: "Failed to clear chassis data" });
      }
      res.json({ message: "Chassis data cleared successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear chassis data" });
    }
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      const user = await storage.getUserByUsername(validatedData.username);
      if (!user) {
        return res.status(401).json({ message: "Kullan\u0131c\u0131 ad\u0131 veya \u015Fifre hatal\u0131" });
      }
      const isPasswordValid = await bcrypt2.compare(validatedData.password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Kullan\u0131c\u0131 ad\u0131 veya \u015Fifre hatal\u0131" });
      }
      const { password, ...userWithoutPassword } = user;
      res.json({
        user: userWithoutPassword,
        token: "user_authenticated_" + Date.now()
        // More unique token
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Giri\u015F i\u015Flemi ba\u015Far\u0131s\u0131z" });
      }
    }
  });
  app2.get("/api/users", authenticate, requireAdmin, async (req, res) => {
    try {
      const users = await storage.getUsers();
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  app2.get("/api/users/:id", authenticate, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  app2.post("/api/users", authenticate, requireAdmin, async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Bu kullan\u0131c\u0131 ad\u0131 zaten mevcut" });
      }
      const hashedPassword = await bcrypt2.hash(validatedData.password, 10);
      const userDataWithHashedPassword = {
        ...validatedData,
        password: hashedPassword
      };
      const user = await storage.createUser(userDataWithHashedPassword);
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to create user" });
      }
    }
  });
  app2.put("/api/users/:id", authenticate, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = updateUserSchema.parse({ ...req.body, id });
      if (validatedData.username) {
        const existingUser = await storage.getUserByUsername(validatedData.username);
        if (existingUser && existingUser.id !== id) {
          return res.status(400).json({ message: "Bu kullan\u0131c\u0131 ad\u0131 zaten mevcut" });
        }
      }
      let updateData = { ...validatedData };
      if (validatedData.password) {
        updateData.password = await bcrypt2.hash(validatedData.password, 10);
      }
      const user = await storage.updateUser(id, updateData);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to update user" });
      }
    }
  });
  app2.delete("/api/users/:id", authenticate, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (id === 1) {
        return res.status(400).json({ message: "Admin kullan\u0131c\u0131s\u0131 silinemez" });
      }
      const success = await storage.deleteUser(id);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs2 from "fs";
import path3 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path2 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path2.resolve(import.meta.dirname, "client", "src"),
      "@shared": path2.resolve(import.meta.dirname, "shared"),
      "@assets": path2.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path2.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path2.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    fs: {
      strict: true,
      deny: ["**/.*"]
    },
    hmr: {
      clientPort: 443
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path3.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path3.resolve(import.meta.dirname, "public");
  if (!fs2.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(cors({
  origin: process.env.NODE_ENV === "development" ? true : false,
  // Allow all origins in development
  credentials: true,
  optionsSuccessStatus: 200
}));
var limiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 100,
  // limit each IP to 100 requests per windowMs
  message: { message: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false
});
app.use("/api/", limiter);
var authLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 5,
  // limit each IP to 5 login attempts per windowMs
  message: { message: "Too many login attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});
app.use("/api/auth/", authLimiter);
app.use(express2.json({ limit: "10mb" }));
app.use(express2.urlencoded({ extended: false, limit: "10mb" }));
app.use((req, res, next) => {
  const start = Date.now();
  const path4 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path4.startsWith("/api")) {
      let logLine = `${req.method} ${path4} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
