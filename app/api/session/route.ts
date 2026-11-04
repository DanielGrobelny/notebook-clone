import {NextResponse} from 'next/server';
import {createClient} from '../../../lib/supabase/server';
export async function POST(){try{const db=await createClient();const {error}=await db.rpc('ensure_visitor_notebook');if(error)throw error;return NextResponse.json({ready:true});}catch{return NextResponse.json({error:'session_unavailable'},{status:503});}}
