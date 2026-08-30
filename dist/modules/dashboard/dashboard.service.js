import { SECTION_ORDER, SECTION_TITLES, WIDGETS, hasGate } from './dashboard.widgets.js';
export const dashboardService = {
    async summary(permissions, asOfDate) {
        const applicable = WIDGETS.filter((w) => hasGate(permissions, w.requiredPermission));
        const settled = await Promise.allSettled(applicable.map((w) => w.build({ asOfDate, permissions })));
        const widgets = settled.flatMap((result, i) => {
            if (result.status === 'fulfilled')
                return [{ section: applicable[i].section, widget: result.value }];
            console.error(`Dashboard widget "${applicable[i].id}" failed:`, result.reason);
            return [];
        });
        const sections = SECTION_ORDER.map((sectionId) => ({
            id: sectionId,
            title: SECTION_TITLES[sectionId],
            widgets: widgets.filter((w) => w.section === sectionId).map((w) => w.widget),
        })).filter((s) => s.widgets.length > 0);
        return { asOfDate, sections };
    },
};
