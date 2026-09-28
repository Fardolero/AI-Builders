export const EXCHANGE_STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  accepted: "Aceptada",
  rejected: "Rechazada",
  countered: "Contraoferta",
  coordinating: "Coordinando",
  completed: "Concretado",
  cancelled: "Cancelado",
};

export function exchangeStatusLabel(status: string) {
  return EXCHANGE_STATUS_LABELS[status] ?? status;
}
