/**
 * Admin data access layer — same idea as src/lib/data.ts.
 * Swap each function body for a database query later; pages stay the same.
 */
import roles from "@/data/admin/roles.json";
import overview from "@/data/admin/overview.json";
import stores from "@/data/admin/stores.json";
import products from "@/data/admin/products.json";
import logs from "@/data/admin/logs.json";
import ticketSlips from "@/data/admin/ticket-slips.json";
import ticketLinks from "@/data/admin/ticket-links.json";
import tokenCash from "@/data/admin/token-cash.json";
import tokenTransfers from "@/data/admin/token-transfers.json";
import tokenHistory from "@/data/admin/token-history.json";
import storePos from "@/data/admin/store-pos.json";
import storeSales from "@/data/admin/store-sales.json";
import financeRevenue from "@/data/admin/finance-revenue.json";
import financeAttendance from "@/data/admin/finance-attendance.json";

export type AdminConfig = typeof roles;
export type RoleKey = keyof typeof roles.roles;

export async function getAdminConfig(): Promise<AdminConfig> {
  return roles;
}

export async function getOverview() {
  return overview;
}

export async function getStores() {
  return stores;
}

export async function getProductCatalog() {
  return products;
}

export async function getLogs() {
  return logs;
}

export async function getTicketSlips() {
  return ticketSlips;
}

export async function getTicketLinks() {
  return ticketLinks;
}

export async function getTokenCash() {
  return tokenCash;
}

export async function getTokenTransfers() {
  return tokenTransfers;
}

export async function getTokenHistory() {
  return tokenHistory;
}

export async function getStorePos() {
  return storePos;
}

export async function getStoreSales() {
  return storeSales;
}

export async function getFinanceRevenue() {
  return financeRevenue;
}

export async function getFinanceAttendance() {
  return financeAttendance;
}
