
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const SUPABASE_URL = "https://pjscnzymofaijevonxkm.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqc2Nuenltb2ZhaWpldm9ueGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxNjQzNTUsImV4cCI6MjA4Mjc0MDM1NX0.JgWvL53a8ZqQUXQK5nQQ1cGtMzkqm1WktY0Yc3Gqu1I";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function diagnose() {
    console.log("🔍 DIAGNOSIS STARTED: Auditing Document Sections...");

    // 1. Find the document "luxscaler_v3.9" (or approximate)
    const { data: docs, error: docError } = await supabase
        .from('documents')
        .select('id, title')
        .ilike('title', '%v3.9%');

    if (docError) {
        console.error("❌ Error fetching docs:", docError);
        return;
    }

    if (!docs || docs.length === 0) {
        console.log("⚠️ No document found matching '%v3.9%'. Listing all recent docs...");
        const { data: allDocs } = await supabase.from('documents').select('id, title').limit(5);
        console.log("Recent Docs:", allDocs);
        return;
    }

    console.log(`✅ Found ${docs.length} documents. analyzing the first one: ${docs[0].title} (${docs[0].id})`);
    const docId = docs[0].id;

    // 2. Fetch sections for this doc
    const { data: sections, error: secError } = await supabase
        .from('document_sections')
        .select('id, section_title, level, order_index, created_at')
        .eq('document_id', docId)
        .order('order_index', { ascending: true });

    if (secError) {
        console.error("❌ Error fetching sections:", secError);
        return;
    }

    console.log(`📊 Total Sections: ${sections.length}`);

    // 3. Detect Duplicates
    const titleCounts: Record<string, number> = {};
    const duplicates: string[] = [];

    sections.forEach(s => {
        const norm = s.section_title.trim().toLowerCase();
        titleCounts[norm] = (titleCounts[norm] || 0) + 1;
        if (titleCounts[norm] === 2) duplicates.push(norm); // Push once
    });

    if (duplicates.length > 0) {
        console.log("🚨 DUPLICATES DETECTED:");
        duplicates.forEach(d => {
            console.log(`   - "${d}" appears ${titleCounts[d]} times.`);
        });

        // Detailed duplicate info
        const dupDetails = sections.filter(s => duplicates.includes(s.section_title.trim().toLowerCase()));
        console.table(dupDetails.map(d => ({ title: d.section_title, id: d.id, created: d.created_at })));

    } else {
        console.log("✅ No database duplicates found for this document.");
    }
}

diagnose();
