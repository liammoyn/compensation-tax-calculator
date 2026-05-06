import { serve } from "bun";
import {
	deletePackage,
	getAllPackages,
	getGlobalTaxInputs,
	setGlobalTaxInputs,
	upsertPackage,
} from "./db";
import index from "./index.html";

const server = serve({
	routes: {
		"/api/packages": {
			GET: () => Response.json(getAllPackages()),
			POST: async (req: Request) => {
				const pkg = await req.json();
				upsertPackage(pkg);
				return Response.json({ ok: true });
			},
		},
		"/api/packages/:id": {
			DELETE: (req: Request) => {
				const id = new URL(req.url).pathname.split("/").pop() ?? "";
				deletePackage(id);
				return Response.json({ ok: true });
			},
		},
		"/api/tax-inputs": {
			GET: () => Response.json(getGlobalTaxInputs()),
			PUT: async (req: Request) => {
				const taxInputs = await req.json();
				setGlobalTaxInputs(taxInputs);
				return Response.json({ ok: true });
			},
		},
		"/*": index,
	},
	development: process.env.NODE_ENV !== "production" && {
		hmr: true,
		console: true,
	},
});

console.log(`🚀 Server running at ${server.url}`);
