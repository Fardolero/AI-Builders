"use client";

import { signOutAction } from "@/app/actions/auth";
import { TrocarButton } from "@/components/trocar/button";

export function SignOutButton() {
  return (
    <TrocarButton
      variant="secondary"
      onClick={() => {
        void signOutAction();
      }}
    >
      Salir
    </TrocarButton>
  );
}
