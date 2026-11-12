import { useState } from 'react';
import { put } from '../api';
import { StatusBadge } from './ui';
import { useToast } from './toast';

/* ─── The status chip as the control ───────────────────────
   Pausing a workflow used to cost four clicks (card → Edit → toggle → Save),
   which is one more than anyone wants for "stop it for now". The Enabled /
   Disabled chip is already the one place the state is stated, so it is also
   the place to change it: click it and the same field the edit modal writes
   flips through the same PUT — including mark_enabled()'s bookkeeping, so an
   auto-paused workflow's record closes when someone switches it back on.

   The payload is deliberately two fields. The route writes only what it is
   sent (exclude_unset), but WorkflowIn.name is required, so the saved name
   rides along unchanged rather than sending a partial the API would reject. */

export interface ToggleableWorkflow {
  id: number;
  name: string;
  enabled: boolean;
}

/** Everything the chip will do, derived once so the tooltip, the toast and the
 *  request cannot disagree about which way the click goes. */
export function statusAction(enabled: boolean) {
  const enabling = !enabled;
  return {
    target: enabling,
    title: enabling ? 'Enable scheduled runs' : 'Pause scheduled runs',
    toast: enabling ? 'Workflow enabled' : 'Workflow paused — schedules will not start',
    tone: enabling ? 'success' : 'info',
  } as const;
}

export function WorkflowStatusToggle<W extends ToggleableWorkflow>({
  workflow, onChange,
}: {
  workflow: W;
  /** Handed the fresh WorkflowOut after the flip. */
  onChange?: (workflow: W) => void;
}) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const action = statusAction(workflow.enabled);

  const toggle = async (e: React.MouseEvent<HTMLButtonElement>) => {
    // A workflow card navigates on click; the chip must never trigger that.
    e.stopPropagation();
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      onChange?.(await put<W>(`/workflows/${workflow.id}`, {
        name: workflow.name,
        enabled: action.target,
      }));
      toast(action.toast, action.tone);
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Could not change the workflow', 'error');
    } finally { setBusy(false); }
  };

  return (
    <StatusBadge value={workflow.enabled ? 'enabled' : 'disabled'}
                 onClick={toggle} busy={busy} title={action.title} />
  );
}
