import { defineCloudflareConfig } from '@opennextjs/cloudflare';

// Default setup. Pages that read Supabase are rendered on every request, so no
// R2 bucket or queue is needed. See the README if you want cached pages later.
export default defineCloudflareConfig();
