import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: Request) {
  try {
    const { email, password, firstName, fatherName, surname, mobile } = await req.json();

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Create user with email auto-confirmed
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { 
        first_name: firstName,
        father_name: fatherName,
        surname: surname,
        mobile: mobile,
        role: 'student' 
      }
    });

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: newUser.user.id,
          first_name: firstName,
          father_name: fatherName,
          surname: surname,
          mobile: mobile,
          email: email,
          role: 'student'
        });

    if (profileError) {
      // Cleanup user if profile creation fails
      await supabase.auth.admin.deleteUser(newUser.user.id);
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'Student registered successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
