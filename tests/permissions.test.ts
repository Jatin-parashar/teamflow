import { Role, hasMinRole, Permissions } from "@/features/types";

describe("hasMinRole", () => {
  it("Owner has all roles", () => {
    expect(hasMinRole(Role.OWNER, Role.GUEST)).toBe(true);
    expect(hasMinRole(Role.OWNER, Role.ADMIN)).toBe(true);
    expect(hasMinRole(Role.OWNER, Role.OWNER)).toBe(true);
  });

  it("Guest has only Guest role", () => {
    expect(hasMinRole(Role.GUEST, Role.GUEST)).toBe(true);
    expect(hasMinRole(Role.GUEST, Role.MEMBER)).toBe(false);
    expect(hasMinRole(Role.GUEST, Role.ADMIN)).toBe(false);
  });

  it("Manager has Manager and below", () => {
    expect(hasMinRole(Role.MANAGER, Role.MANAGER)).toBe(true);
    expect(hasMinRole(Role.MANAGER, Role.MEMBER)).toBe(true);
    expect(hasMinRole(Role.MANAGER, Role.ADMIN)).toBe(false);
  });
});

describe("Permissions", () => {
  it("only Admin and above can manage users", () => {
    expect(Permissions.canManageUsers(Role.OWNER)).toBe(true);
    expect(Permissions.canManageUsers(Role.ADMIN)).toBe(true);
    expect(Permissions.canManageUsers(Role.MANAGER)).toBe(false);
    expect(Permissions.canManageUsers(Role.MEMBER)).toBe(false);
    expect(Permissions.canManageUsers(Role.GUEST)).toBe(false);
  });

  it("only Manager and above can create tasks", () => {
    expect(Permissions.canCreateTasks(Role.MANAGER)).toBe(true);
    expect(Permissions.canCreateTasks(Role.MEMBER)).toBe(false);
    expect(Permissions.canCreateTasks(Role.GUEST)).toBe(false);
  });

  it("Member and above can update task status", () => {
    expect(Permissions.canUpdateTaskStatus(Role.MEMBER)).toBe(true);
    expect(Permissions.canUpdateTaskStatus(Role.MANAGER)).toBe(true);
    expect(Permissions.canUpdateTaskStatus(Role.GUEST)).toBe(false);
  });

  it("everyone can view projects and tasks", () => {
    expect(Permissions.canViewProjects(Role.GUEST)).toBe(true);
    expect(Permissions.canViewTasks(Role.GUEST)).toBe(true);
  });
});
