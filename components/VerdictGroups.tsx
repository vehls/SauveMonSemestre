import type { UEResult, ValidationStatus } from '@/types/calculator';
import { buildVerdictGroups, type VerdictGroupId } from '@/lib/verdict-groups';

interface VerdictGroupsProps {
  ues: { id: string; name: string }[];
  ueResults: UEResult[];
  status: ValidationStatus;
  /** `true` tant qu'il reste un examen sans note effective. */
  semesterIncomplete: boolean;
}

const GROUP_STYLE: Record<VerdictGroupId, { frame: string; chip: string }> = {
  acquired: {
    frame: 'border-l-status-ok-500',
    chip: 'bg-status-ok-50 text-status-ok-700',
  },
  compensated: {
    frame: 'border-l-status-warn-500',
    chip: 'bg-status-warn-50 text-status-warn-700',
  },
  retake: {
    frame: 'border-l-status-danger-500',
    chip: 'bg-status-danger-50 text-status-danger-700',
  },
};

/**
 * Sous la barre de résultat : uniquement les UE au verdict verrouillé.
 * Pas d'ECTS. Une UE incomplète dont la moyenne partielle dépasse 10
 * n'apparaît pas ici tant que son issue n'est pas certaine.
 */
export function VerdictGroups({ ues, ueResults, status, semesterIncomplete }: VerdictGroupsProps) {
  const { groups, othersCanStillMove } = buildVerdictGroups(ues, ueResults, status, semesterIncomplete);
  if (groups.length === 0) return null;

  return (
    <section aria-label="Capitalisation des UE" className="space-y-3">
      {groups.map((group) => {
        const style = GROUP_STYLE[group.id];
        return (
          <article
            key={group.id}
            className={`rounded-2xl border border-slate-200/70 bg-white p-4 shadow-rest border-l-4 ${style.frame}`}
          >
            <h2 className="type-card-title">{group.title}</h2>
            <p className="type-body mt-1">{group.text}</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {group.ues.map((ue) => (
                <li key={ue.id} className={`rounded-full px-3 py-1 text-sm font-medium ${style.chip}`}>
                  {ue.name}
                </li>
              ))}
            </ul>
          </article>
        );
      })}
      {othersCanStillMove && (
        <p className="type-meta px-1">Les autres UE peuvent encore bouger.</p>
      )}
    </section>
  );
}
