export const supabase = {
  from: () => supabase,
  insert: () => supabase,
  select: () => supabase,
  single: () => supabase,
  order: () => supabase,
  eq: () => supabase,
  update: () => supabase,
  delete: () => supabase,
  auth: {
    getUser: async () => ({ data: { user: { id: 'mock-user-id' } } }),
  },
}; 