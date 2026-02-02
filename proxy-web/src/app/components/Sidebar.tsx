"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  { name: "API List", path: "/api-list" },
  { name: "API 추가", path: "/api-add" },
  { name: "Logs", path: "/logs" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-screen bg-gray-900 text-white">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold">Proxy Server</h1>
      </div>
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                href={item.path}
                className={`block px-4 py-2 rounded-lg transition-colors ${
                  pathname === item.path
                    ? "bg-blue-600 text-white"
                    : "hover:bg-gray-700"
                }`}
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
