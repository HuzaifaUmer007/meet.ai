"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function signUpWithEmail(input: {
  name: string;
  email: string;
  password: string;
}): Promise<{ error: string | null }> {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (serviceRoleKey) {
    const admin = createAdminClient();
    const { error: createError } = await admin.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: { full_name: input.name },
    });

    if (createError) {
      return { error: createError.message };
    }
  } else {
    const supabase = await createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: { data: { full_name: input.name } },
    });

    if (signUpError) {
      return { error: signUpError.message };
    }
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });

  if (signInError) {
    return { error: signInError.message };
  }

  return { error: null };
}
