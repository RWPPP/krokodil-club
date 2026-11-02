# Krokodil gateway on ONREZA

This builds the existing fixed-upstream gateway for ONREZA Compute. It forwards
only the club's existing API routes to Render. Database and VK credentials stay
on Render; this deployment needs no environment secrets.

The frontend is not switched by this package. Verify the actual application URL
from the affected network before changing production origins or the VK callback.

Build with `node build.mjs`. The output is `dist`; its V2 manifest declares one
Node.js process, 128 MB memory, a 180-second request limit, and the assigned PORT.
Readiness uses TCP so a sleeping upstream does not restart a healthy gateway.

Use the free Hobby workspace only. It includes a monthly usage credit, not
unlimited compute. Exhausting the credit stops billable functionality. Do not
enable Pro or add payment details for this repair.

After signing in with the official CLI, create or select exactly one project,
deploy this directory to a test environment, and record the returned URL and
deployment ID. Test health, anonymous sessions, a full portal response, logout,
and CORS. Ask the owner to test health without VPN before switching the site.

Official references:
- https://docs.onreza.ru/manifest.html
- https://docs.onreza.ru/cli-api.html
- https://docs.onreza.ru/billing/limits.html
