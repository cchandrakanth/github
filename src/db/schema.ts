import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const folders = sqliteTable(
  'folders',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    position: integer('position').notNull(),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (t) => [uniqueIndex('idx_folders_name').on(t.name)],
);

export const notes = sqliteTable(
  'notes',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull().default(''),
    bodyHtml: text('body_html').notNull().default(''),
    bodyText: text('body_text').notNull().default(''),
    folderId: text('folder_id').references(() => folders.id, { onDelete: 'set null' }),
    pinned: integer('pinned').notNull().default(0),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
    deletedAt: integer('deleted_at'),
  },
  (t) => [
    index('idx_notes_folder_list').on(t.folderId, t.deletedAt, t.pinned, t.updatedAt),
    index('idx_notes_list').on(t.deletedAt, t.updatedAt),
  ],
);

export const tags = sqliteTable(
  'tags',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    color: text('color'),
    createdAt: integer('created_at').notNull(),
  },
  (t) => [uniqueIndex('idx_tags_name').on(t.name)],
);

export const noteTags = sqliteTable(
  'note_tags',
  {
    noteId: text('note_id')
      .notNull()
      .references(() => notes.id, { onDelete: 'cascade' }),
    tagId: text('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.noteId, t.tagId] }), index('idx_note_tags_tag').on(t.tagId, t.noteId)],
);

export const reminders = sqliteTable(
  'reminders',
  {
    id: text('id').primaryKey(),
    noteId: text('note_id')
      .notNull()
      .references(() => notes.id, { onDelete: 'cascade' }),
    kind: text('kind', { enum: ['once', 'daily', 'weekly'] }).notNull(),
    atDatetime: integer('at_datetime'),
    timeOfDay: text('time_of_day'),
    weekday: integer('weekday'),
    enabled: integer('enabled').notNull().default(1),
    notificationId: text('notification_id'),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (t) => [index('idx_reminders_note').on(t.noteId), index('idx_reminders_enabled').on(t.enabled, t.kind)],
);

export type Folder = typeof folders.$inferSelect;
export type Note = typeof notes.$inferSelect;
export type Tag = typeof tags.$inferSelect;
export type Reminder = typeof reminders.$inferSelect;
export type ReminderKind = Reminder['kind'];
