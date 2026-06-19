"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";

export default function LogoutPage() {
  useEffect(() => {
    void signOut({ callbackUrl: "/login" });
  }, []);

  return null;
}
