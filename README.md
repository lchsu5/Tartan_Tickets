# Tartan Tickets

The Next.js application is in [TartanTickets/](TartanTickets/). Open that folder
to run the app. Specifications, the security audit, and assignment verification
are linked from the [app README](TartanTickets/README.md).

```powershell
cd TartanTickets
npm.cmd ci
npm.cmd run dev
```

Open http://localhost:3000.

This outer directory is the single Git repository. The previous nested Git
metadata is preserved locally at `.repo-backups/TartanTickets.git` and ignored.
Its generated files remain only in that backup's old history, not in this
repository's tracked app files. Do not publish the backup.

For a Git-based Vercel deployment, choose `TartanTickets` as the Root Directory.
