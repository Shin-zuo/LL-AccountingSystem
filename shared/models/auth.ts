import { users, sessions } from "../schema";

export { users, sessions };

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
