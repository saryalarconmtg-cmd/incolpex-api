import { ESTADO_LABELS, ESTADO_BADGE_CLASSES } from '../utils/estado';

export default function EstadoBadge({ estado }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${ESTADO_BADGE_CLASSES[estado] || 'bg-slate-100 text-slate-700'}`}
    >
      {ESTADO_LABELS[estado] || estado}
    </span>
  );
}
