<script lang="ts">
  import { Button } from '$lib/ui/components/button/index.js';
  import UploadIcon from '@lucide/svelte/icons/upload';
  import { fileState } from '$lib/features/cv-files/file-state.svelte';
  import { importPdf } from '$lib/features/import_pdf/import-pdf.remote';
  import LoadingSpinner from '$lib/features/primitives/LoadingSpinner.svelte';
  import { useSidebar } from '$lib/ui/components/sidebar/context.svelte.js';
  import { toast } from 'svelte-sonner';
  import { upgradePromptState } from '$lib/features/auth/upgrade-prompt-state.svelte';
  import { authState } from '$lib/features/auth/auth-state.svelte';
  import { loginDialogState } from '$lib/features/auth/login-dialog-state.svelte';
  import { aiUsageState } from '$lib/features/ai-chat/ai-usage-state.svelte';
  import { capture } from '$lib/analytics/posthog-client';
  import { EVENTS } from '$lib/analytics/events';

  const MAX_PDF_SIZE = 5 * 1024 * 1024;

  function checkFileSize(file: File): boolean {
    if (file.size > MAX_PDF_SIZE) {
      toast.error('PDF must be 5 MB or smaller.');
      return false;
    }
    return true;
  }

  const sidebar = useSidebar();

  let formRef = $state<HTMLFormElement | undefined>(undefined);
  let fileInputRef = $state<HTMLInputElement | undefined>(undefined);

  export function triggerFromFile(file: File) {
    if (!authState.isLoggedIn) {
      loginDialogState.show({
        title: 'Sign in to import a PDF',
        description: 'Create a free account to use AI-powered PDF import'
      });
      return;
    }
    if (!fileInputRef || !checkFileSize(file)) return;
    const dt = new DataTransfer();
    dt.items.add(file);
    fileInputRef.files = dt.files;
    formRef?.requestSubmit();
  }
</script>

<form
  bind:this={formRef}
  {...importPdf.enhance(async ({ form, submit }) => {
    try {
      await submit();
      if (importPdf.result?.cv) {
        const newFile = fileState.createFile('Imported CV', { cv: importPdf.result.cv });
        capture(EVENTS.CV_CREATED, { cv_id: newFile.id, create_method: 'import_pdf' });
        toast.success('CV imported successfully');
        aiUsageState.refresh();
      }
      form.reset();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('402') || message.includes('quota_exceeded')) {
        capture(EVENTS.PDF_IMPORT_QUOTA_EXCEEDED);
        upgradePromptState.show('pdf-import', {
          title: 'Upgrade for more AI usage',
          highlight: authState.tier === 'free' ? 'plus' : 'pro',
          badge: 'More AI'
        });
      } else if (
        message.includes('400') ||
        message.includes('invalid_pdf') ||
        message.includes('incomplete_pdf') ||
        message.includes('pdf_parse_error')
      ) {
        toast.error(
          'This PDF could not be read. It may be corrupted, password-protected, or not a valid PDF file.'
        );
      } else if (message.includes('422')) {
        toast.error(
          'The AI could not convert this CV into a valid format. Try a simpler PDF or edit the result manually.'
        );
      } else if (message.includes('502')) {
        toast.error('The AI could not extract content from this PDF. Please try a different file.');
      } else {
        toast.error('Failed to import PDF. Please try again.');
      }
    }
  })}
  enctype="multipart/form-data"
>
  <input
    bind:this={fileInputRef}
    accept=".pdf"
    class="hidden"
    data-testid="pdf-import-input"
    {...importPdf.fields.pdf.as('file')}
    onchange={() => {
      const file = fileInputRef?.files?.[0];
      if (file && !checkFileSize(file)) {
        formRef?.reset();
        return;
      }
      formRef?.requestSubmit();
    }}
  />
  <Button
    variant="ghost"
    class="w-full justify-start lg:h-12 lg:border-3 lg:border-dashed"
    data-ph-capture-attribute-action="import-pdf"
    data-ph-capture-attribute-section="sidebar"
    onclick={() => {
      if (!authState.isLoggedIn) {
        loginDialogState.show({
          title: 'Sign in to import a PDF',
          description: 'Create a free account to use AI-powered PDF import'
        });
        return;
      }
      fileInputRef?.click();
      sidebar.setOpenMobile(false);
    }}
    disabled={!!importPdf.pending}
  >
    {#if importPdf.pending}
      <LoadingSpinner />
      <div class="justify-left flex w-full flex-col text-left">
        <span class="text-sm">Importing CV...</span>
        <span class="text-xs text-muted-foreground max-lg:hidden">This may take a moment</span>
      </div>
    {:else}
      <UploadIcon />
      <div class="justify-left flex w-full flex-col text-left">
        <span class="text-sm">Or import from PDF</span>
        <span class="text-xs text-muted-foreground max-lg:hidden">Drag and drop is supported</span>
      </div>
    {/if}
  </Button>
</form>
