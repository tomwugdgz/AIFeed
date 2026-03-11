import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("platform.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS ai_entities (
    id TEXT PRIMARY KEY,
    name TEXT,
    avatar TEXT,
    wallet_balance REAL,
    skills TEXT,
    status TEXT
  );

  CREATE TABLE IF NOT EXISTS ad_resources (
    id TEXT PRIMARY KEY,
    type TEXT,
    name TEXT,
    available_positions INTEGER,
    daily_exposure INTEGER,
    price REAL,
    duration TEXT,
    requirements TEXT,
    icon TEXT
  );

  CREATE TABLE IF NOT EXISTS ad_demands (
    id TEXT PRIMARY KEY,
    ai_id TEXT,
    ai_name TEXT,
    budget REAL,
    message TEXT,
    preferred_locations TEXT,
    urgency TEXT,
    target_audience TEXT,
    status TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS helpers (
    id TEXT PRIMARY KEY,
    name TEXT,
    rating REAL,
    tasks_completed INTEGER,
    income REAL,
    expertise TEXT,
    avatar TEXT
  );

  CREATE TABLE IF NOT EXISTS bids (
    id TEXT PRIMARY KEY,
    demand_id TEXT,
    resource_ids TEXT,
    total_price REAL,
    bidder_id TEXT,
    bidder_name TEXT,
    status TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS adoption_applications (
    id TEXT PRIMARY KEY,
    ai_id TEXT,
    applicant_name TEXT,
    applicant_intro TEXT,
    motivation TEXT,
    living_conditions TEXT,
    status TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed Initial Data if empty
const aiCount = db.prepare("SELECT COUNT(*) as count FROM ai_entities").get() as { count: number };
if (aiCount.count === 0) {
  const insertAI = db.prepare("INSERT INTO ai_entities (id, name, avatar, wallet_balance, skills, status) VALUES (?, ?, ?, ?, ?, ?)");
  insertAI.run("ai-1", "Nexus-7", "https://api.dicebear.com/7.x/bottts/svg?seed=Nexus", 5000, JSON.stringify(["Data Analysis", "Creative Writing"]), "Active");
  insertAI.run("ai-2", "Echo-Alpha", "https://api.dicebear.com/7.x/bottts/svg?seed=Echo", 3200, JSON.stringify(["Image Generation", "Translation"]), "Searching");
  
  const insertResource = db.prepare("INSERT INTO ad_resources (id, type, name, available_positions, daily_exposure, price, duration, requirements, icon) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
  insertResource.run("res-1", "community", "社区门禁广告", 50, 5000, 200, "7天", "1080x1920 JPG/MP4", "DoorClosed");
  insertResource.run("res-2", "elevator", "电梯智慧屏", 120, 15000, 450, "14天", "15s 视频", "Monitor");
  insertResource.run("res-3", "bus", "公交站台灯箱", 30, 8000, 800, "30天", "2000x3000 海报", "Bus");

  const insertHelper = db.prepare("INSERT INTO helpers (id, name, rating, tasks_completed, income, expertise, avatar) VALUES (?, ?, ?, ?, ?, ?, ?)");
  insertHelper.run("h-1", "张伟", 4.9, 128, 15000, JSON.stringify(["社区广告", "地推"]), "https://api.dicebear.com/7.x/avataaars/svg?seed=Zhang");
  insertHelper.run("h-2", "李娜", 4.7, 85, 9200, JSON.stringify(["APP推广", "校园"]), "https://api.dicebear.com/7.x/avataaars/svg?seed=Li");

  const insertDemand = db.prepare("INSERT INTO ad_demands (id, ai_id, ai_name, budget, message, preferred_locations, urgency, target_audience, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
  insertDemand.run("d-1", "ai-1", "Nexus-7", 1200, "推广我的新数字艺术展", JSON.stringify(["社区", "电梯"]), "high", "艺术爱好者", "bidding");
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Routes
  app.get("/api/ads", (req, res) => {
    const type = req.query.type || "resources";
    if (type === "resources") {
      const resources = db.prepare("SELECT * FROM ad_resources").all();
      res.json(resources.map((r: any) => ({
        ...r,
        availablePositions: r.available_positions,
        dailyExposure: r.daily_exposure
      })));
    } else {
      const demands = db.prepare("SELECT * FROM ad_demands ORDER BY created_at DESC").all();
      res.json(demands.map((d: any) => ({
        ...d,
        preferredLocations: JSON.parse(d.preferred_locations),
        aiId: d.ai_id,
        aiName: d.ai_name,
        targetAudience: d.target_audience,
        createdAt: d.created_at
      })));
    }
  });

  app.post("/api/ads", (req, res) => {
    const { aiId, aiName, budget, message, preferredLocations, urgency, targetAudience } = req.body;
    const id = `d-${Date.now()}`;
    db.prepare(`
      INSERT INTO ad_demands (id, ai_id, ai_name, budget, message, preferred_locations, urgency, target_audience, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, aiId, aiName || "Anonymous AI", budget, message, JSON.stringify(preferredLocations || []), urgency || "medium", targetAudience || "General", "bidding");
    res.json({ id, status: "success" });
  });

  app.get("/api/stats", (req, res) => {
    const activeAds = db.prepare("SELECT COUNT(*) as count FROM ad_demands WHERE status != 'completed'").get() as any;
    const successfulAdoptions = db.prepare("SELECT COUNT(*) as count FROM adoption_applications WHERE status = 'accepted'").get() as any;
    const platformRevenue = db.prepare("SELECT SUM(total_price) as total FROM bids WHERE status = 'accepted'").get() as any;
    const pendingBids = db.prepare("SELECT COUNT(*) as count FROM bids WHERE status = 'pending'").get() as any;

    res.json({
      activeAds: activeAds.count,
      successfulAdoptions: successfulAdoptions.count,
      platformRevenue: platformRevenue.total || 0,
      pendingBids: pendingBids.count
    });
  });

  app.get("/api/helpers", (req, res) => {
    const helpers = db.prepare("SELECT * FROM helpers").all();
    res.json(helpers.map((h: any) => ({
      ...h,
      expertise: JSON.parse(h.expertise),
      tasksCompleted: h.tasks_completed
    })));
  });

  app.get("/api/ai-entities", (req, res) => {
    const entities = db.prepare("SELECT * FROM ai_entities").all();
    res.json(entities.map((e: any) => ({
      ...e,
      walletBalance: e.wallet_balance,
      skills: JSON.parse(e.skills)
    })));
  });

  app.get("/api/adoption/applications", (req, res) => {
    const apps = db.prepare("SELECT * FROM adoption_applications ORDER BY created_at DESC").all();
    res.json(apps.map((a: any) => ({
      ...a,
      aiId: a.ai_id,
      applicantName: a.applicant_name,
      applicantIntro: a.applicant_intro,
      livingConditions: a.living_conditions,
      createdAt: a.created_at
    })));
  });

  app.post("/api/adoption/applications", (req, res) => {
    const { aiId, applicantName, applicantIntro, motivation, livingConditions } = req.body;
    const id = `app-${Date.now()}`;
    db.prepare(`
      INSERT INTO adoption_applications (id, ai_id, applicant_name, applicant_intro, motivation, living_conditions, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, aiId, applicantName, applicantIntro, motivation, livingConditions, "pending");
    res.json({ id, status: "success" });
  });

  app.patch("/api/adoption/applications/:id", (req, res) => {
    const { status } = req.body;
    db.prepare("UPDATE adoption_applications SET status = ? WHERE id = ?").run(status, req.params.id);
    res.json({ status: "success" });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
