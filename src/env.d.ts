/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    admin: { id: number; username: string } | null;
  }
}
