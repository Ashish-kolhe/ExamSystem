import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const adminEmail = 'admin@geniusit.com';
  const adminPassword = '@shish';

  // Check if admin already exists
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    return NextResponse.json({ error: listError.message }, { status: 500 });
  }

  const existingAdmin = users.users.find(u => u.email === adminEmail);

  if (!existingAdmin) {
    // Create admin user
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: { role: 'admin' }
    });

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: newUser.user.id,
        first_name: 'Admin',
        surname: 'Genius IT',
        role: 'admin'
      });

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Admin created successfully' });
  }

  return NextResponse.json({ message: 'Admin already exists' });
}
