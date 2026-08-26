export function renderTemplate(template, data) {
    return template.replace(/\{\{(\w+)\}\}/g, (_match, key) => data[key] ?? '');
}
