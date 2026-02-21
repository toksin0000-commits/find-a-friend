import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  
  // Chráníme pouze admin cesty
  if (path.startsWith('/admin')) {
    const anonId = req.cookies.get('anon_id')?.value;
    
    if (!anonId) {
      return NextResponse.redirect(new URL('/', req.url));
    }
    
    // Ověříme u Supabase, jestli je admin
    try {
      const res = await fetch(`${req.nextUrl.origin}/api/admin/check`, {
        headers: { 'x-anon-id': anonId }
      });
      const data = await res.json();
      
      if (!data.isAdmin) {
        return NextResponse.redirect(new URL('/', req.url));
      }
    } catch {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};