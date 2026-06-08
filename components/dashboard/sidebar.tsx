"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Home,
  Building2,
  GraduationCap,
  MapPin,
  DollarSign,
  LogOut,
  Menu,
  X,
  Users,
  ChevronDown,
  Award,
  FileText,
  ChevronRight,
  ChevronLeft,
  FolderOpen,
  HelpCircle,
  BookOpen,
  Calendar,
  type LucideIcon,
} from "lucide-react";
import { authService, User as UserType } from "@/lib/auth";
import { useYear } from "@/contexts/year-context";

type NavItem = { name: string; href: string; icon: LucideIcon };

const overviewItems: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Người Dùng", href: "/dashboard/users", icon: Users },
  { name: "Cơ Sở", href: "/dashboard/campuses", icon: MapPin },
];

const yearItems: NavItem[] = [
  { name: "Quản Lý Năm Học", href: "/dashboard/years", icon: Calendar },
];

const dataManagementItems: NavItem[] = [
  { name: "Khoa", href: "/dashboard/departments", icon: Building2 },
  { name: "Chương Trình", href: "/dashboard/programs", icon: GraduationCap },
  { name: "Học Phí", href: "/dashboard/tuition", icon: DollarSign },
  { name: "Học Bổng", href: "/dashboard/scholarships", icon: Award },
  { name: "Phương Thức Tuyển Sinh", href: "/dashboard/admission-methods", icon: FileText },
];

const faqItems: NavItem[] = [
  { name: "Chủ Đề & Chủ Đề Con", href: "/dashboard/faq/topics", icon: FolderOpen },
  { name: "Câu Hỏi & Câu Trả Lời", href: "/dashboard/faq/questions", icon: HelpCircle },
  { name: "Bộ Câu Hỏi", href: "/dashboard/faq/collections", icon: BookOpen },
];

interface SidebarProps {
  className?: string;
}

function isNavItemActive(pathname: string, href: string) {
  const faqTopicsAliases = ["/dashboard/faq/sub-topics"];
  const faqQuestionsAliases = ["/dashboard/faq/answers"];
  return (
    pathname === href ||
    (href !== "/dashboard" && pathname.startsWith(href + "/")) ||
    (href === "/dashboard/faq/topics" && faqTopicsAliases.some((a) => pathname.startsWith(a))) ||
    (href === "/dashboard/faq/questions" && faqQuestionsAliases.some((a) => pathname.startsWith(a)))
  );
}

export default function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { selectedYear, setSelectedYear } = useYear();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [user, setUser] = useState<UserType | null>(null);

  useEffect(() => {
    setUser(authService.getUserData());
  }, []);

  const handleLogout = () => {
    authService.logout();
    router.push("/login");
  };

  const toggleGroup = (groupName: string) => {
    const next = new Set(collapsedGroups);
    if (next.has(groupName)) next.delete(groupName);
    else next.add(groupName);
    setCollapsedGroups(next);
  };

  const renderNavSection = (label: string, items: NavItem[]) => (
    <div className="space-y-0.5">
      {!isCollapsed && (
        <div className="flex items-center justify-between">
          <h3 className="px-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
            {label}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleGroup(label)}
            className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
          >
            {collapsedGroups.has(label) ? (
              <ChevronRight className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </Button>
        </div>
      )}
      {(!collapsedGroups.has(label) || isCollapsed) && (
        <div className="space-y-0.5">
          {items.map((item) => {
            const active = isNavItemActive(pathname, item.href);
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={active ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start transition-all duration-200",
                    isCollapsed ? "px-2 h-9" : "px-2.5 h-8",
                    active
                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                      : "hover:bg-gray-100 text-gray-700",
                    !isCollapsed && "text-[13px]"
                  )}
                  title={isCollapsed ? item.name : undefined}
                >
                  <item.icon
                    className={cn(
                      "h-4 w-4 flex-shrink-0",
                      !isCollapsed && "mr-3",
                      active ? "text-white" : "text-gray-500"
                    )}
                  />
                  {!isCollapsed && <span className="truncate">{item.name}</span>}
                </Button>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div
      className={cn(
        "flex h-screen shrink-0 flex-col overflow-hidden border-r border-gray-200 bg-white transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-64",
        className
      )}
    >
      <div className="flex h-16 items-center justify-between border-b bg-gradient-to-r from-blue-600 to-blue-700 px-4">
        {isCollapsed ? (
          <div className="flex items-center justify-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white p-1">
              <Image src="/Logo-FPT-1024x620.webp" alt="FPT University Logo" width={24} height={15} className="object-contain" />
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white p-1">
              <Image src="/Logo-FPT-1024x620.webp" alt="FPT University Logo" width={32} height={20} className="object-contain" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">FPT University</h1>
              <p className="text-xs text-blue-100">Admin Dashboard</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 p-0 text-white hover:bg-blue-500"
        >
          {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="min-h-0 flex-1 overflow-hidden px-2 py-2">
        <div className="space-y-2.5">
          {renderNavSection("Tổng Quan", overviewItems)}

          {selectedYear === null ? (
            renderNavSection("Năm Học", yearItems)
          ) : (
            <>
              <div className="px-1">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedYear(null);
                    router.push("/dashboard/years");
                  }}
                  className={cn(
                    "w-full border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800",
                    isCollapsed ? "h-9 px-2" : "h-auto flex-col items-start px-2.5 py-2"
                  )}
                  title={isCollapsed ? `Năm ${selectedYear}` : "Bấm để đổi năm"}
                >
                  {isCollapsed ? (
                    <ChevronLeft className="h-4 w-4" />
                  ) : (
                    <>
                      <span className="flex items-center text-[13px] font-semibold">
                        <ChevronLeft className="mr-1.5 h-3.5 w-3.5" />
                        Năm {selectedYear}
                      </span>
                      <span className="text-[10px] font-normal text-blue-500">Bấm để đổi năm</span>
                    </>
                  )}
                </Button>
              </div>
              {renderNavSection("Quản Lý Dữ Liệu", dataManagementItems)}
              {renderNavSection("Câu Hỏi FAQ", faqItems)}
            </>
          )}
        </div>
      </nav>

      <div className="shrink-0 border-t bg-gray-50 p-2">
        {!isCollapsed && user && (
          <div className="mb-2 flex items-center gap-2 px-1">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
              <span className="text-[10px] font-semibold text-white">
                {user.username.slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-gray-900">{user.username}</p>
              <p className="text-[10px] font-medium text-blue-600">
                {user.role === "super_admin" ? "Super Admin" : "Admin"}
              </p>
            </div>
          </div>
        )}

        <Button
          variant="ghost"
          onClick={handleLogout}
          className={cn(
            "w-full justify-start border border-red-200 text-red-600 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-700",
            isCollapsed ? "px-2 h-9" : "h-8 px-2.5"
          )}
          title={isCollapsed ? "Đăng Xuất" : undefined}
        >
          <LogOut className={cn("h-4 w-4", !isCollapsed && "mr-3")} />
          {!isCollapsed && <span className="font-medium">Đăng Xuất</span>}
        </Button>
      </div>
    </div>
  );
}
