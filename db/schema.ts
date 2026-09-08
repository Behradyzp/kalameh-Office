import {integer,sqliteTable,text} from "drizzle-orm/sqlite-core";

export const workspaceState=sqliteTable("workspace_state",{
  id:text("id").primaryKey(),
  data:text("data").notNull(),
  updatedAt:integer("updated_at").notNull(),
});

export const authUsers=sqliteTable("auth_users",{
  id:text("id").primaryKey(),
  email:text("email").notNull().unique(),
  name:text("name").notNull(),
  role:text("role").notNull().default("member"),
  passwordHash:text("password_hash").notNull(),
  passwordSalt:text("password_salt").notNull(),
  passwordIterations:integer("password_iterations").notNull().default(210000),
  active:integer("active",{mode:"boolean"}).notNull().default(true),
  createdAt:integer("created_at").notNull(),
  updatedAt:integer("updated_at").notNull(),
});

export const authSessions=sqliteTable("auth_sessions",{
  id:text("id").primaryKey(),
  userId:text("user_id").notNull().references(()=>authUsers.id,{onDelete:"cascade"}),
  tokenHash:text("token_hash").notNull().unique(),
  expiresAt:integer("expires_at").notNull(),
  createdAt:integer("created_at").notNull(),
  lastSeenAt:integer("last_seen_at").notNull(),
});
