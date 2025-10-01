import {
  getAreas,
  getAreaById,
  addArea,
  updateArea,
  deleteArea,
  addInspection,
  getUserById,
  dbCreateUser,
  ensureUserExists,
} from './db';

// This file is now a proxy to export functions from db.ts.
// This is to avoid circular dependencies and module resolution issues with Next.js Server Actions.

export {
  getAreas,
  getAreaById,
  addArea,
  updateArea,
  deleteArea,
  addInspection,
  getUserById,
  dbCreateUser,
  ensureUserExists,
};
