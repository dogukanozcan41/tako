import type { Express } from "express";
import { createServer, type Server } from "http";
import * as bcrypt from "bcryptjs";
import { storage } from "./storage";
import { authenticate, requireAdmin, requireAuth } from "./middleware/auth";
import { 
  insertDamageRecordSchema, 
  updateDamageRecordSchema,
  insertModelSchema,
  insertSettingsSchema,
  insertChassisDataSchema,
  insertUserSchema,
  updateUserSchema,
  loginSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Damage Records Routes (Protected)
  app.get("/api/damage-records", authenticate, requireAuth, async (req, res) => {
    try {
      const records = await storage.getDamageRecords();
      res.json(records);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch damage records" });
    }
  });

  app.get("/api/damage-records/:id", authenticate, requireAuth, async (req, res) => {
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

  app.post("/api/damage-records", authenticate, requireAuth, async (req, res) => {
    try {
      const validatedData = insertDamageRecordSchema.parse(req.body);
      
      // Check if chassis number already exists
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

  app.put("/api/damage-records/:id", authenticate, requireAuth, async (req, res) => {
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

  app.delete("/api/damage-records/:id", authenticate, requireAuth, async (req, res) => {
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

  // Models Routes (Protected)
  app.get("/api/models", authenticate, requireAuth, async (req, res) => {
    try {
      const models = await storage.getModels();
      res.json(models);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch models" });
    }
  });

  app.post("/api/models", authenticate, requireAdmin, async (req, res) => {
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

  app.delete("/api/models/:id", authenticate, requireAdmin, async (req, res) => {
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

  // Settings Routes (Protected)
  app.get("/api/settings", authenticate, requireAuth, async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.put("/api/settings", authenticate, requireAdmin, async (req, res) => {
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

  // Chassis Data Routes (Protected)
  app.get("/api/chassis-data", authenticate, requireAuth, async (req, res) => {
    try {
      const chassisData = await storage.getChassisData();
      res.json(chassisData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chassis data" });
    }
  });

  app.get("/api/chassis-data/:chassisNumber", authenticate, requireAuth, async (req, res) => {
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

  app.post("/api/chassis-data/bulk", authenticate, requireAdmin, async (req, res) => {
    try {
      // Clear existing data first
      await storage.clearChassisData();
      
      const validatedData = req.body.map((item: any) => insertChassisDataSchema.parse(item));
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

  app.post("/api/chassis-data/add", authenticate, requireAdmin, async (req, res) => {
    try {
      const validatedData = req.body.map((item: any) => insertChassisDataSchema.parse(item));
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

  app.delete("/api/chassis-data", authenticate, requireAdmin, async (req, res) => {
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

  // Authentication Routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      const user = await storage.getUserByUsername(validatedData.username);
      
      if (!user) {
        return res.status(401).json({ message: "Kullanıcı adı veya şifre hatalı" });
      }

      // Check password with bcrypt
      const isPasswordValid = await bcrypt.compare(validatedData.password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Kullanıcı adı veya şifre hatalı" });
      }

      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      res.json({ 
        user: userWithoutPassword,
        token: "user_authenticated_" + Date.now() // More unique token
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Giriş işlemi başarısız" });
      }
    }
  });

  // User Management Routes (Admin only)
  app.get("/api/users", authenticate, requireAdmin, async (req, res) => {
    try {
      const users = await storage.getUsers();
      // Remove passwords from response
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:id", authenticate, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post("/api/users", authenticate, requireAdmin, async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Bu kullanıcı adı zaten mevcut" });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);
      const userDataWithHashedPassword = {
        ...validatedData,
        password: hashedPassword
      };

      const user = await storage.createUser(userDataWithHashedPassword);
      // Remove password from response
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

  app.put("/api/users/:id", authenticate, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = updateUserSchema.parse({ ...req.body, id });
      
      // If username is being updated, check if it already exists
      if (validatedData.username) {
        const existingUser = await storage.getUserByUsername(validatedData.username);
        if (existingUser && existingUser.id !== id) {
          return res.status(400).json({ message: "Bu kullanıcı adı zaten mevcut" });
        }
      }

      // If password is being updated, hash it
      let updateData = { ...validatedData };
      if (validatedData.password) {
        updateData.password = await bcrypt.hash(validatedData.password, 10);
      }

      const user = await storage.updateUser(id, updateData);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
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

  app.delete("/api/users/:id", authenticate, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Prevent deletion of admin user (id: 1)
      if (id === 1) {
        return res.status(400).json({ message: "Admin kullanıcısı silinemez" });
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

  const httpServer = createServer(app);
  return httpServer;
}
