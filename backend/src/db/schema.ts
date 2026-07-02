import { index } from "drizzle-orm/pg-core";
import { unique } from "drizzle-orm/pg-core";
import { varchar ,pgTable, boolean, timestamp, serial, integer} from "drizzle-orm/pg-core";
import { table } from "node:console";

export const users = pgTable('users',{
    id: serial('id').primaryKey(),
    name: varchar('name', {length: 255}).notNull(),
    email: varchar('email', {length: 255}).notNull().unique(),
    password: varchar('password', {length: 255}).notNull(),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
})

export const spaces = pgTable('spaces', {
    id: serial('id').primaryKey(),
    name: varchar('name', {length: 255}).notNull(),
    description: varchar('description', {length: 500}),
    createdBy: integer('created_by').references(() => users.id).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    isActive: boolean('is_active').default(true),
    slug: varchar('slug', {length: 255}).unique().notNull()
}, (table) => ({
    slugIdx: index('slug_idx').on(table.slug)
}))

export const userSpaces = pgTable('user_spaces', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id).notNull(),
    spaceId: integer('space_id').references(() => spaces.id).notNull(),
    role: varchar('role', {length: 20}).notNull().default('member'), // 'admin' | 'member'
    invitedBy: integer('invited_by').references(() => users.id),
    joinedAt: timestamp('joined_at').defaultNow().notNull(),
    isActive: boolean('is_active').default(true),
}, (table) => ({
    uniqueUserSpace: unique().on(table.userId, table.spaceId),
    userIdIdx: index('user_id_idx').on(table.userId),
    spaceIdIdx: index('space_id_idx').on(table.spaceId),
}));