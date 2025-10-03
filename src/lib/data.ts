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
  getAppSettings,
  addRecipientEmail,
  removeRecipientEmail,
} from './db';

// This file is now a proxy to export functions from db.ts.
// This is to avoid circular dependencies and module resolution issues.

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
  getAppSettings,
  addRecipientEmail,
  removeRecipientEmail,
};
