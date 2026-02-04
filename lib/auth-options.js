// Centralized authOptions re-export to avoid fragile relative paths.
// We import from the NextAuth route file which declares and exports authOptions.
// If you move authOptions to a dedicated module later, update this file accordingly.
export { authOptions } from '@/app/api/auth/[...nextauth]/route';
