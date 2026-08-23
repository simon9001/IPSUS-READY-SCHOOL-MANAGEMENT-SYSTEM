import { attendanceRepository } from './attendance.repository.js';
export const attendanceService = {
    listByStudent: (studentId) => attendanceRepository.findByStudent(studentId),
    listByClassAndDate: (classId, attendanceDate) => attendanceRepository.findByClassAndDate(classId, attendanceDate),
    mark: (input) => attendanceRepository.upsert(input),
    async markBulk(records) {
        const results = [];
        for (const record of records) {
            results.push(await attendanceRepository.upsert(record));
        }
        return results;
    },
};
