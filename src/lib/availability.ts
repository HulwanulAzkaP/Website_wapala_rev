export type Period = {
    enabled: boolean;
    archived: boolean;
    opensAt: Date | null;
    closesAt: Date | null;
};
export function isRecruitmentOpen(
    period: Period | null,
    now = new Date(),
): boolean {
    return Boolean(
        period &&
        period.enabled &&
        !period.archived &&
        (!period.opensAt || now >= period.opensAt) &&
        (!period.closesAt || now < period.closesAt),
    );
}
