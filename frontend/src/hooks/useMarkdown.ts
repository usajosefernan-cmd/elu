import { useState, useEffect } from 'react';

export const useMarkdown = (filename: string) => {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!filename) return;

        const fetchMarkdown = async () => {
            try {
                setLoading(true);
                // Assumes markdown files are in public/legal/
                const response = await fetch(`/legal/${filename}`);

                if (!response.ok) {
                    throw new Error(`Failed to fetch markdown: ${response.statusText}`);
                }

                const text = await response.text();
                setContent(text);
            } catch (err) {
                console.error('Error loading markdown:', err);
                setError(err instanceof Error ? err.message : 'Unknown error');
                setContent('# Error loading content\nPlease try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchMarkdown();
    }, [filename]);

    return { content, loading, error };
};
