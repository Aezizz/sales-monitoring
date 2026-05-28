import {
  LayoutDashboard,
  Upload,
  CheckSquare,
  Download,
  Tag,
  Package,
  Store,
  Database
} from "lucide-react";

export const appNavigation = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    allowedRoles: ["SUPER_ADMIN", "STAFF", "OWNER", "VIEWER"]
  },
  {
    title: "Import Data",
    href: "/import",
    icon: Upload,
    allowedRoles: ["SUPER_ADMIN", "STAFF"]
  },
  {
    title: "Data Correction",
    href: "/corrections",
    icon: CheckSquare,
    allowedRoles: ["SUPER_ADMIN", "STAFF", "OWNER"]
  },
  {
    title: "Export Reports",
    href: "/export",
    icon: Download,
    allowedRoles: ["SUPER_ADMIN", "STAFF", "OWNER"]
  },
  {
    title: "Promotions Analytics",
    href: "/promotions",
    icon: Tag,
    allowedRoles: ["SUPER_ADMIN", "STAFF", "OWNER"]
  },
  {
    title: "Master Products",
    href: "/products",
    icon: Package,
    allowedRoles: ["SUPER_ADMIN", "STAFF", "OWNER"]
  },
  {
    title: "Master Stores",
    href: "/stores",
    icon: Store,
    allowedRoles: ["SUPER_ADMIN", "STAFF", "OWNER"]
  },
  {
    title: "Data Management",
    href: "/data-management",
    icon: Database,
    allowedRoles: ["SUPER_ADMIN"]
  }
];
