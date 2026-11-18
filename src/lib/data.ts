/**
 * Data access layer.
 *
 * Every page reads data only through these functions. Right now they return
 * the mock JSON files in src/data. When the database is ready, replace the
 * body of each function with a real query (Prisma, fetch to an API, …) and
 * keep the same return shape — no page needs to change.
 */
import event from "@/data/event.json";
import products from "@/data/products.json";
import order from "@/data/order.json";
import demo from "@/data/demo.json";
import { readDb } from "@/lib/db";
import attendee from "@/data/attendee.json";

export type EventInfo = typeof event;
export type Products = typeof products;
export type Order = typeof order;
export type Attendee = typeof attendee;

export async function getEvent(): Promise<EventInfo> {
  return event;
}

export async function getProducts(): Promise<Products> {
  return products;
}

export async function getCurrentOrder(): Promise<Order> {
  return order;
}

export async function getAttendee(): Promise<Attendee> {
  // balance always reflects what staff top-ups / store purchases did to the shared wallet
  const w = readDb().wallets.find((x) => x.id === demo.wallet.id);
  return w ? { ...attendee, wallet: { ...attendee.wallet, id: w.id, balance: w.balance } } : attendee;
}
