"use client";
import { signOut } from "next-auth/react";
export default function LogoutPage() {
  signOut({ callbackUrl: "/login" });
  return null;
}
