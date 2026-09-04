import { useEffect } from 'react';
import { toast } from 'sonner';
import { registerResumeWebMcpTools } from './resume-tools';

export function useResumeWebMcp(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();
    void registerResumeWebMcpTools(controller.signal).catch((error) => {
      console.error('Failed to register WebMCP resume tools.', error);
    });

    const handleActivity = (event: Event) => {
      const message = (event as CustomEvent<{ message?: string }>).detail?.message;
      toast.success(message || 'The agent updated the resume.', {
        description: 'The change is visible in the editor and can be undone.'
      });
    };
    window.addEventListener('rendercv:webmcp-activity', handleActivity);

    return () => {
      controller.abort();
      window.removeEventListener('rendercv:webmcp-activity', handleActivity);
    };
  }, [enabled]);
}

