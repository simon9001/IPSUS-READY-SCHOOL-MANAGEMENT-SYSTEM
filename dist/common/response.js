export function ok(c, data, status = 200) {
    return c.json({ success: true, data }, status);
}
export function created(c, data) {
    return ok(c, data, 201);
}
export function noContent(c) {
    return c.body(null, 204);
}
