import AuditLog from "../models/AuditLog.js";

/**
 * Creează un log pentru o activitate efectuată în sistem.
 * 
 * @param {Object} options - Parametrii pentru log.
 * @param {string} options.action - Acțiunea efectuată (ex. "Order Created").
 * @param {string} options.userId - ID-ul utilizatorului care a efectuat acțiunea.
 * @param {string} [options.orderId] - ID-ul comenzii asociate (opțional).
 * @param {string} [options.details] - Detalii suplimentare despre acțiune (opțional).
 */
export const createLog = async ({ action, userId, orderId = null, details = "" }) => {
    try {
        const log = new AuditLog({
            action,
            userId,
            orderId,
            details,
        });
        await log.save();
        console.log("Audit log created:", log);
    } catch (error) {
        console.error("Error creating audit log:", error.message);
    }
};
