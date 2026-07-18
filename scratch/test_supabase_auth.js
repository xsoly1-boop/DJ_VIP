import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAuth() {
  console.log("Signing up a test user...");
  const { data, error } = await supabase.auth.signUp({
    email: 'testdjvip2026@gmail.com',
    password: 'password123',
    options: {
      data: {
        display_name: 'Test DJ'
      }
    }
  });

  if (error) {
    console.error("Auth error:", error);
  } else {
    console.log("Auth success! User created:", data.user.id);
  }
}

testAuth();
