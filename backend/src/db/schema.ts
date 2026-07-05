import { index } from "drizzle-orm/pg-core";
import { unique } from "drizzle-orm/pg-core";
import { varchar ,pgTable, boolean, timestamp, serial, integer} from "drizzle-orm/pg-core";

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
}, (table) => ([
    index('slug_idx').on(table.slug)
]))

export const userSpaces = pgTable('user_spaces', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id).notNull(),
    spaceId: integer('space_id').references(() => spaces.id).notNull(),
    role: varchar('role', {length: 20}).notNull().default('member'), // 'admin' | 'member'
    invitedBy: integer('invited_by').references(() => users.id),
    joinedAt: timestamp('joined_at').defaultNow().notNull(),
    isActive: boolean('is_active').default(true),
}, (table) => ([
    unique().on(table.userId, table.spaceId),
    index('user_id_idx').on(table.userId),
    index('space_id_idx').on(table.spaceId),
]));

export const habits = pgTable('habits', {
    id: serial('id').primaryKey(),
    spaceId: integer('space_id').references(() => spaces.id).notNull(),
    createdBy: integer('created_by').references(() => users.id).notNull(),
    name: varchar('name', {length: 255}).notNull(),
    description: varchar('description', {length: 500}),
    type: varchar('type', {length: 20}).notNull().default('personal'),
    frequency: varchar('frequency', {length: 20}).notNull().default('daily'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ([
    index('habit_space_id_idx').on(table.spaceId),
    index('habit_created_by_idx').on(table.createdBy),
    index('habit_type_idx').on(table.type)
]))

export const habitLogs = pgTable('habit_logs', {
    id: serial('id').primaryKey(),
    habitId: integer('habit_id').references(() => habits.id).notNull(),
    userId: integer('user_id').references(() => users.id).notNull(),
    completedAt: timestamp('completed_at').defaultNow().notNull(),
    note: varchar('note', {length: 500}),
    isActive: boolean('is_active').default(true),
}, (table) => ([
    index('habit_log_habit_id_idx').on(table.habitId),
    index('habit_log_user_id_idx').on(table.userId),
    index('habit_log_completed_at_idx').on(table.completedAt),
    unique().on(table.habitId, table.userId, table.completedAt),
]));

export const schema = {
    users,
    spaces,
    userSpaces,
    habits,
    habitLogs,
};