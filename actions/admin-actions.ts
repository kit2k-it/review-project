"use server";

import { listUsersAction, createUserAction, updateUserRoleAction, deleteUserAction, assignEmployeeToCompanyAction, removeEmployeeFromCompanyAction, getCompanyEmployeesAction, getAllEmployeesAction } from "@/actions/user";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

// ==========================================
// USER MANAGEMENT PAGE (Server Component)
// ==========================================
export async function getUsers(params: Parameters<typeof listUsersAction>[0]) {
  return listUsersAction(params);
}

export async function createUser(data: Parameters<typeof createUserAction>[0]) {
  return createUserAction(data);
}

export async function updateRole(userId: string, role: "USER" | "CLIENT" | "EMPLOYEE" | "ADMIN") {
  return updateUserRoleAction(userId, role);
}

export async function removeUser(userId: string) {
  return deleteUserAction(userId);
}

// ==========================================
// COMPANY EMPLOYEE MANAGEMENT
// ==========================================
export async function getEmployees(companyId: string) {
  return getCompanyEmployeesAction(companyId);
}

export async function assignEmployee(employeeId: string, companyId: string) {
  return assignEmployeeToCompanyAction(employeeId, companyId);
}

export async function unassignEmployee(employeeId: string, companyId: string) {
  return removeEmployeeFromCompanyAction(employeeId, companyId);
}

export async function listEmployees() {
  return getAllEmployeesAction();
}

export async function getAllCompanies() {
  await requireAdmin();
  return prisma.company.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}