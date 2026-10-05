export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface BranchResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiError {
  detail?: string;
  message?: string;
  [key: string]: unknown;
}

export interface Branch {
  id: number;
  name: string;
  code: string;
  address: string;
  phone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BranchInput {
  name: string;
  code: string;
  address: string;
  phone: string;
  is_active: boolean;
}

export interface User {
  id: number;
  username: string;
  role: number | { id: number; name: string };
  branch: number | { id: number; name: string } | null;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserInput {
  username: string;
  role: number;
  branch: number | null;
  email: string;
  password?: string;
  phone: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
}

export interface Role {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface RoleInput {
  name: string;
  description: string;
}

export interface RolePermission {
  id: number;
  role: number | { id: number; name: string };
  screen_name: string;
  can_view: boolean;
  can_create: boolean;
  can_update: boolean;
  can_delete: boolean;
  created_at: string;
  updated_at: string;
}

export interface RolePermissionInput {
  role: number;
  screen_name: string;
  can_view: boolean;
  can_create: boolean;
  can_update: boolean;
  can_delete: boolean;
}

export interface Customer {
  id: number;
  branch: number | { id: number; name: string } | null;
  assigned_to: number | { id: number; username: string } | null;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerInput {
  branch: number | null;
  assigned_to: number | null;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  status: string;
}

export interface Lead {
  id: number;
  assigned_to: number | { id: number; username: string } | null;
  customer: number | { id: number; name: string } | null;
  source: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  expected_value: string | number;
  expected_date: string;
  created_at: string;
  updated_at: string;
}

export interface LeadInput {
  assigned_to: number | null;
  customer: number | null;
  source: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  expected_value: string;
  expected_date: string;
}

export interface LeadActivity {
  id: number;
  lead: number | { id: number; title: string };
  user: number | { id: number; username: string };
  activity_type: string;
  subject: string;
  description: string;
  activity_date: string;
  created_at: string;
  updated_at: string;
}

export interface LeadActivityInput {
  lead: number;
  user: number;
  activity_type: string;
  subject: string;
  description: string;
  activity_date: string;
}

export type ResourceType =
  | 'branches'
  | 'users'
  | 'roles'
  | 'rolespermissions'
  | 'customers'
  | 'leads'
  | 'leadactivities';

export interface ListParams {
  page?: number;
  search?: string;
  ordering?: string;
  [key: string]: string | number | boolean | undefined;
}
