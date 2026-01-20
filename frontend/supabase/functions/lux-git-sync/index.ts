import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface GitPayload {
    repoUrl: string; // https://github.com/owner/repo
    branch?: string; // default main
    filePath: string; // path/to/file.md
    content: string;
    message: string;
}

Deno.serve(async (req: Request) => {
    // 1. CORS Preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const payload: GitPayload = await req.json();
        const { repoUrl, branch = "main", filePath, content, message } = payload;

        // 2. Auth & Config
        const token = Deno.env.get("GITHUB_ACCESS_TOKEN");
        if (!token) throw new Error("Missing GITHUB_ACCESS_TOKEN in Secrets");

        // Parse Owner/Repo
        // Expected: https://github.com/owner/repo or just owner/repo
        let owner, repo;
        if (repoUrl.startsWith("http")) {
            const parts = new URL(repoUrl).pathname.split("/").filter(Boolean);
            owner = parts[0];
            repo = parts[1];
        } else {
            [owner, repo] = repoUrl.split("/");
        }

        if (!owner || !repo) throw new Error(`Invalid Repo URL: ${repoUrl}`);

        const baseUrl = `https://api.github.com/repos/${owner}/${repo}`;
        const headers = {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
            "User-Agent": "LuxCanvas-Agent"
        };

        console.log(`[GitSync] Engaging ${owner}/${repo} on branch ${branch}...`);

        // 3. Get Current File SHA (if exists) to allow update
        let sha = null;
        const getFileResp = await fetch(`${baseUrl}/contents/${filePath}?ref=${branch}`, { headers });

        if (getFileResp.ok) {
            const fileData = await getFileResp.json();
            sha = fileData.sha;
            console.log(`[GitSync] File exists. SHA: ${sha}`);
        } else if (getFileResp.status !== 404) {
            throw new Error(`GitHub GetHash Error: ${await getFileResp.text()}`);
        }

        // 4. Update/Create File (PUT /repos/{owner}/{repo}/contents/{path})
        const body: any = {
            message: message || `LuxCanvas Update: ${filePath}`,
            content: btoa(unescape(encodeURIComponent(content))), // UTF-8 Base64
            branch: branch
        };

        if (sha) {
            body.sha = sha;
        }

        console.log(`[GitSync] Committing to ${filePath}...`);

        const putResp = await fetch(`${baseUrl}/contents/${filePath}`, {
            method: "PUT",
            headers,
            body: JSON.stringify(body)
        });

        if (!putResp.ok) {
            const errText = await putResp.text();
            throw new Error(`GitHub Commit Error: ${putResp.status} - ${errText}`);
        }

        const result = await putResp.json();

        return new Response(
            JSON.stringify({
                success: true,
                commit: result.commit.sha,
                html_url: result.content.html_url
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error: any) {
        console.error("[GitSync] Fatal Error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
    }
});
