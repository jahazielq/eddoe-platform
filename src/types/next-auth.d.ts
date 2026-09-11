import type { RoleCode } from "@prisma/client";

declare module "next-auth" {
  interface User {
    id: string;
    roles: RoleCode[];
  }
  interface Session {
    user: {
      id: string;
      email: string;
      roles: RoleCode[];
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
    roles: RoleCode[];
  }
}
