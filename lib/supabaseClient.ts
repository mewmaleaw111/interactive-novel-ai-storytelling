import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey =
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
export function createSupabaseClient(getToken: () => Promise<string | null>) {
return createClient(supabaseUrl, supabaseAnonKey, {
accessToken: async () => {
return await getToken();
},
});
}
